const { test, expect } = require("@playwright/test");

async function completeSpace(page, prefix = "booking") {
  await page.locator(`#${prefix}-service`).selectOption("deep");
  await page.locator(`#${prefix}-zip`).fill("10001");
  await page.locator(`#${prefix}-form [data-next]`).click();
}
async function completeDetails(page, prefix = "booking") {
  await page.locator(`#${prefix}-name`).fill("Alex Smith");
  await page.locator(`#${prefix}-email`).fill("alex@example.com");
  await page.locator(`#${prefix}-form button[type="submit"]`).click();
}

test("all anchor targets, local assets, and SVG symbols resolve", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const failed = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"], use[href^="#"]')]
      .map((a) => a.getAttribute("href"))
      .filter(
        (href) => href.length < 2 || !document.getElementById(href.slice(1)),
      ),
  );
  expect(missing).toEqual([]);
  const duplicateIDs = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(duplicateIDs).toEqual([]);
  const images = await page.locator("img").evaluateAll((elements) =>
    elements.map((img) => ({
      src: img.getAttribute("src"),
      loaded: img.complete && img.naturalWidth > 0,
    })),
  );
  expect(images.every((image) => image.loaded)).toBe(true);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test("main quote validates both steps and preserves values when going back", async ({
  page,
}) => {
  await page.goto("/#book");
  const form = page.locator("#booking-form");
  await form.locator("[data-next]").click();
  await expect(page.locator("#booking-service")).toBeFocused();
  await expect(form.locator(".field-error")).toHaveCount(2);
  await page.locator("#booking-service").selectOption("deep");
  await page.locator("#booking-zip").fill("123");
  await form.locator("[data-next]").click();
  await expect(page.locator("#booking-zip")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#booking-zip").fill("10001");
  await form.locator("[data-next]").click();
  await expect(form.locator('[data-step="2"]')).toBeVisible();
  await expect(form.locator("[data-summary]")).toContainText(
    "Deep cleaning · ZIP 10001",
  );
  await page.locator("#booking-name").fill("Alex Smith");
  await form.locator("[data-back]").click();
  await expect(page.locator("#booking-service")).toHaveValue("deep");
  await expect(page.locator("#booking-zip")).toHaveValue("10001");
  await form.locator("[data-next]").click();
  await expect(page.locator("#booking-name")).toHaveValue("Alex Smith");
  await page.locator("#booking-email").fill("bad-email");
  await form.locator('button[type="submit"]').click();
  await expect(page.locator("#booking-email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#booking-email").fill("alex@example.com");
  await form.locator('button[type="submit"]').click();
  await expect(form.locator(".request-ready")).toBeVisible();
  await expect(form.locator(".request-ready h3")).toHaveText("Thank you!");
  await expect(form.locator("[data-delivery-note]")).toContainText(
    "has not been sent",
  );
  await expect(form.locator('a[href^="mailto:"]')).toHaveCount(0);
  await form.locator("[data-edit]").click();
  await expect(page.locator("#booking-email")).toHaveValue("alex@example.com");
});

test("Enter in step one advances rather than submitting prematurely", async ({
  page,
}) => {
  await page.goto("/#book");
  await page.locator("#booking-service").selectOption("residential");
  await page.locator("#booking-zip").fill("90210");
  await page.locator("#booking-zip").press("Enter");
  await expect(page.locator('#booking-form [data-step="2"]')).toBeVisible();
  await expect(page.locator("#booking-form .request-ready")).toBeHidden();
});

test("service cards preselect the service; ZIP check prepopulates booking without inventing coverage", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('.service-card [data-service="commercial"]').click();
  await expect(page.locator("#booking-service")).toHaveValue("commercial");
  await page.locator("#zipcode").fill("90210");
  await page.locator("#area-form button").click();
  await expect(page.locator("#zip-result")).toContainText(
    "Our team will confirm coverage",
  );
  await expect(page.locator("#booking-zip")).toHaveValue("90210");
  await expect(page.locator(".zip-continue")).toBeVisible();
  await page.locator("#zipcode").fill("10001");
  await expect(page.locator(".zip-continue")).toBeHidden();
});

test("offer form is also two steps; dialog traps focus and restores it on Escape", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.locator("[data-open-offer]");
  await trigger.click();
  await expect(page.locator("#offer-dialog")).toBeVisible();
  await page.locator("#offer-service").selectOption("residential");
  await page.locator("#offer-service").press("Shift+Tab");
  await expect(page.locator(".dialog-close")).toBeFocused();
  await page.locator(".dialog-close").press("Shift+Tab");
  expect(
    await page.evaluate(() => document.activeElement.closest("dialog")?.id),
  ).toBe("offer-dialog");
  await completeSpace(page, "offer");
  await completeDetails(page, "offer");
  await expect(page.locator("#offer-form .request-ready")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#offer-dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass("dialog-open");
});

test("mobile navigation opens, closes on selection and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator(".nav-toggle");
  await expect(page.locator("#nav-menu")).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.locator('#nav-menu a[href="#services"]').click();
  await expect(page.locator("#nav-menu")).toBeHidden();
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

for (const width of [320, 375, 640, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await completeSpace(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await completeDetails(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator("[data-open-offer]").click();
    expect(
      await page.evaluate(() => {
        const rect = document.querySelector("dialog").getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
      }),
    ).toBe(true);
  });
}

test("FAQ works with keyboard and brand links use local original SVG icons", async ({
  page,
}) => {
  await page.goto("/");
  const summary = page.locator(".faq-list summary").first();
  await summary.focus();
  await summary.press("Enter");
  await expect(page.locator(".faq-list details").first()).toHaveAttribute(
    "open",
    "",
  );
  await expect(
    page.locator('.booking-socials img[src="assets/instagram.svg"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.booking-socials img[src="assets/google.svg"]'),
  ).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`accessibility checks pass at ${width}px, including both form steps and offer dialog`, async ({
    page,
  }) => {
    const { default: AxeBuilder } = require("@axe-core/playwright");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const audit = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    };
    await audit();
    await completeSpace(page);
    await audit();
    await page.locator("[data-open-offer]").click();
    await audit();
  });
}

for (const [random, delay] of [
  [0, 5000],
  [0.999999, 7000],
]) {
  test(`offer automatically appears after ${delay / 1000} seconds on every page load and refresh`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
    await page.addInitScript((value) => {
      Math.random = () => value;
    }, random);
    await page.goto("/");

    await page.clock.fastForward(delay - 1000);
    await expect(page.locator("#offer-dialog")).not.toBeVisible();
    await page.clock.fastForward(1000);
    await expect(page.locator("#offer-dialog")).toBeVisible();
    await expect(page.locator('#offer-form [data-step="1"]')).toBeVisible();
    await expect(page.locator("body")).toHaveClass("dialog-open");
    await page.keyboard.press("Escape");
    await page.clock.fastForward(30000);
    await expect(page.locator("#offer-dialog")).not.toBeVisible();
    await page.reload();
    await page.clock.fastForward(delay - 1);
    await expect(page.locator("#offer-dialog")).not.toBeVisible();
    await page.clock.fastForward(1);
    await expect(page.locator("#offer-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/");
    await page.clock.fastForward(delay);
    await expect(page.locator("#offer-dialog")).toBeVisible();
  });
}

test("automatic offer does not interrupt an in-progress quote", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
  await page.goto("/");

  await page.locator("#booking-service").selectOption("deep");
  await page.locator("#booking-zip").fill("10001");
  await page.clock.fastForward(20000);
  await expect(page.locator("#offer-dialog")).not.toBeVisible();
  await expect(page.locator("#booking-service")).toHaveValue("deep");
  await page.locator("[data-open-offer]").click();
  await expect(page.locator("#offer-dialog")).toBeVisible();
});

test("opening and dismissing the offer manually cancels its automatic timer", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
  await page.goto("/");

  await page.locator("[data-open-offer]").click();
  await page.keyboard.press("Escape");
  await page.clock.fastForward(20000);
  await expect(page.locator("#offer-dialog")).not.toBeVisible();
});

test("automatic popup still works when session storage is unavailable", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");

  await page.clock.fastForward(15000);
  await expect(page.locator("#offer-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.fastForward(30000);
  await expect(page.locator("#offer-dialog")).not.toBeVisible();
});

for (const width of [390, 1440]) {
  test(`GitHub Pages project path loads matching styles and scripts at ${width}px despite old asset caches`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const legacyRequests = [];
    const failed = [];
    // Simulate browsers/proxies retaining the previous unversioned assets.
    await page.route(
      /\/(css\/style\.css|js\/main\.js)(\?.*)?$/,
      async (route) => {
        const url = new URL(route.request().url());
        if (!url.searchParams.has("v")) {
          legacyRequests.push(url.href);
          await route.fulfill({
            contentType: url.pathname.endsWith(".css")
              ? "text/css"
              : "text/javascript",
            body: url.pathname.endsWith(".css")
              ? ".hero-grid { display: block; }"
              : "// stale script",
          });
        } else {
          await route.continue();
        }
      },
    );
    page.on("response", (response) => {
      if (response.status() >= 400) failed.push(response.url());
    });
    await page.goto("/IM-excellence-cleaning/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".hero-grid")).toHaveCSS("display", "grid");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(23, 47, 62)");
    await expect(page.locator(".hero-image")).toHaveCSS("object-fit", "cover");
    expect(
      await page.evaluate(() => document.fonts.check("400 14px Manrope")),
    ).toBe(true);
    const assets = await page.evaluate(() => ({
      stylesheet: document.querySelector('link[rel="stylesheet"]').href,
      script: document.querySelector("script[src]").src,
      image: document.querySelector(".hero-image").src,
    }));
    expect(assets.stylesheet).toMatch(
      /\/IM-excellence-cleaning\/css\/style\.css\?v=[a-f0-9]{12}$/,
    );
    expect(assets.script).toMatch(
      /\/IM-excellence-cleaning\/js\/main\.js\?v=[a-f0-9]{12}$/,
    );
    expect(assets.image).toContain("/IM-excellence-cleaning/assets/");
    await completeSpace(page);
    await expect(page.locator('#booking-form [data-step="2"]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(legacyRequests).toEqual([]);
    expect(failed).toEqual([]);
  });
}

test("all Google profile links use the supplied Maps destination", async ({
  page,
}) => {
  await page.goto("/");
  const links = page.locator(
    'a[href="https://maps.app.goo.gl/nM1auwHershaoVy47"]',
  );
  await expect(links).toHaveCount(4);
  await expect(page.locator('a[href*="share.google"]')).toHaveCount(0);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

for (const width of [390, 1440]) {
  test(`gallery lightbox supports navigation, focus and dismissal at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/IM-excellence-cleaning/");
    const item = page.locator('[data-gallery-index="1"]');
    await item.click();
    const dialog = page.locator("#gallery-lightbox");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#lightbox-title")).toHaveText("Kitchen");
    await expect(page.locator("#lightbox-counter")).toHaveText("2 / 4");
    await expect(page.locator("#lightbox-image")).toHaveAttribute(
      "src",
      "assets/gallery-kitchen.jpg",
    );
    await expect(page.locator(".lightbox-close")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".lightbox-next")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#lightbox-title")).toHaveText("Bathroom");
    await page.locator(".lightbox-prev").click();
    await expect(page.locator("#lightbox-title")).toHaveText("Kitchen");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#lightbox-counter")).toHaveText("4 / 4");
    await page.locator(".lightbox-next").click();
    await expect(page.locator("#lightbox-counter")).toHaveText("1 / 4");
    expect(
      await page
        .locator("#lightbox-image")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    const { default: AxeBuilder } = require("@axe-core/playwright");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(item).toBeFocused();
    await expect(page.locator("body")).not.toHaveClass("dialog-open");
    await item.click();
    await page.locator(".lightbox-close").click();
    await expect(dialog).not.toBeVisible();
    await item.click();
    await page.mouse.click(2, 2);
    await expect(dialog).not.toBeVisible();
  });
}

for (const [width, height] of [
  [375, 667],
  [390, 844],
  [1440, 900],
]) {
  test(`both popup steps fit without scrolling at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.locator("[data-open-offer]").click();
    const checkFit = async () => {
      const size = await page.locator("#offer-dialog").evaluate((dialog) => ({
        scrollHeight: dialog.scrollHeight,
        clientHeight: dialog.clientHeight,
        top: dialog.getBoundingClientRect().top,
        bottom: dialog.getBoundingClientRect().bottom,
      }));
      expect(size.scrollHeight).toBeLessThanOrEqual(size.clientHeight + 1);
      expect(size.top).toBeGreaterThanOrEqual(0);
      expect(size.bottom).toBeLessThanOrEqual(height);
    };
    await checkFit();
    await completeSpace(page, "offer");
    await checkFit();
    await page.locator(".offer-additional summary").click();
    await page
      .locator("#offer-notes")
      .fill("Please pay extra attention to the kitchen.");
    await completeDetails(page, "offer");
    await expect(page.locator("#offer-form .request-ready h3")).toHaveText(
      "Thank you!",
    );
    await expect(page.locator("#offer-notes")).toHaveValue(
      "Please pay extra attention to the kitchen.",
    );
    await expect(page.locator("#offer-form .request-ready")).toBeVisible();
  });
}

test("small-height popup remains scrollable and optional fields remain reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/");
  await page.locator("[data-open-offer]").click();
  await completeSpace(page, "offer");
  await page.locator(".offer-additional summary").click();
  await page.locator("#offer-notes").fill("Small-screen request");
  await completeDetails(page, "offer");
  await expect(page.locator("#offer-form .request-ready")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveClass("dialog-open");
});

test("timed offer does not stack over the gallery lightbox", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
  await page.goto("/");
  await page.locator('[data-gallery-index="0"]').click();
  await page.clock.fastForward(20000);
  await expect(page.locator("#gallery-lightbox")).toBeVisible();
  await expect(page.locator("#offer-dialog")).not.toBeVisible();
});

async function configureSubmission(page) {
  await page.route("**/", async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'name="cleaning-form-endpoint" content=""',
        'name="cleaning-form-endpoint" content="/api/enquiries"',
      ),
    });
  });
}

for (const prefix of ["booking", "offer"]) {
  test(`${prefix} form shows thank you only after a configured endpoint accepts the request`, async ({
    page,
  }) => {
    await configureSubmission(page);
    let received;
    await page.route("**/api/enquiries", async (route) => {
      received = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: '{"accepted":true}',
      });
    });
    await page.goto("/");
    if (prefix === "offer") await page.locator("[data-open-offer]").click();
    await completeSpace(page, prefix);
    if (prefix === "offer")
      await page.locator(".offer-additional summary").click();
    await page.locator(`#${prefix}-notes`).fill("Kitchen needs attention");
    await completeDetails(page, prefix);
    const form = page.locator(`#${prefix}-form`);
    await expect(form.locator(".request-ready h3")).toHaveText("Thank you!");
    await expect(form.locator("[data-thank-you-message]")).toContainText(
      "Your request has been received",
    );
    await expect(form.locator("[data-delivery-note]")).toBeHidden();
    expect(received).toMatchObject({
      service: "deep",
      zip: "10001",
      name: "Alex Smith",
      email: "alex@example.com",
      notes: "Kitchen needs attention",
      source: `${prefix}-form`,
    });
    await expect(form).not.toContainText(
      /open email|email draft|copy request/i,
    );
    const { default: AxeBuilder } = require("@axe-core/playwright");
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}

test("failed delivery preserves details, shows an error, and permits retry", async ({
  page,
}) => {
  await configureSubmission(page);
  let attempts = 0;
  await page.route("**/api/enquiries", async (route) => {
    attempts++;
    await route.fulfill({ status: attempts === 1 ? 500 : 201, body: "{}" });
  });
  await page.goto("/");
  await completeSpace(page);
  await completeDetails(page);
  const form = page.locator("#booking-form");
  await expect(form.locator(".form-message")).toContainText("couldn’t send");
  await expect(form.locator(".request-ready")).toBeHidden();
  await expect(page.locator("#booking-email")).toHaveValue("alex@example.com");
  await form.locator('button[type="submit"]').click();
  await expect(form.locator("[data-thank-you-message]")).toContainText(
    "has been received",
  );
  expect(attempts).toBe(2);
});

test("old session flags do not suppress the popup on a new load", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T00:00:01Z"));
  await page.addInitScript(() =>
    sessionStorage.setItem("imex_offer_shown", "1"),
  );
  await page.goto("/");
  await page.clock.fastForward(7000);
  await expect(page.locator("#offer-dialog")).toBeVisible();
});
