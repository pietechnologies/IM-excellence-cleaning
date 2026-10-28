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
  const draft = decodeURIComponent(
    await form.locator("[data-email-link]").getAttribute("href"),
  );
  expect(draft).toContain("mailto:hello@imexcellencecleaning.com");
  expect(draft).toContain("Service: Deep cleaning");
  expect(draft).toContain("Name: Alex Smith");
  await expect(form.locator(".request-ready")).toContainText(
    "not confirmed until we reply",
  );
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
  [0, 10000],
  [0.999999, 15000],
]) {
  test(`offer automatically appears after ${delay / 1000} seconds, only once per session`, async ({
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
    await page.clock.fastForward(20000);
    await expect(page.locator("#offer-dialog")).not.toBeVisible();
    await page.locator("[data-open-offer]").click();
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
