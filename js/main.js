/* Static, dependency-free interactions for IM Excellence Cleaning. */
(() => {
  "use strict";

  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const offerDialog = document.getElementById("offer-dialog");
  const galleryDialog = document.getElementById("gallery-lightbox");
  const bookingForm = document.getElementById("booking-form");
  const serviceNames = {
    residential: "Residential cleaning",
    deep: "Deep cleaning",
    move: "Move-in / move-out",
    commercial: "Commercial cleaning",
  };
  // Configure an HTTPS JSON POST endpoint to enable real request delivery.
  const submissionEndpoint =
    document
      .querySelector('meta[name="cleaning-form-endpoint"]')
      ?.content.trim() || "";
  const controllers = new Map();
  const serviceAreas = window.IMServiceAreas;
  const outsideAreaMessage =
    "Sorry, we’re not serving this ZIP code. Please call or text us to discuss your location.";

  function addContactLinks(container) {
    const links = document.createElement("span");
    links.className = "zip-contact-links";
    for (const [label, href] of [
      ["Call us", "tel:+18133168298"],
      ["Text us", "sms:+18133168298"],
    ]) {
      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      links.append(link);
    }
    container.append(links);
  }

  const coverageList = document.getElementById("coverage-list");
  Object.entries(serviceAreas.areas).forEach(([city, zips]) => {
    const item = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = city;
    const list = document.createElement("p");
    list.textContent = zips.join(", ");
    item.append(title, list);
    coverageList.append(item);
  });

  function closeMenu(returnFocus = false) {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) navToggle.focus();
  }

  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });
  navMenu
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => closeMenu()));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-inner")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("open"))
      closeMenu(true);
  });
  window
    .matchMedia("(min-width: 861px)")
    .addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });

  // Fresh page-local timer on every load/refresh; no session or local storage.
  let offerShown = false;
  let autoOfferDue = false;
  let offerTimer;

  function openOffer() {
    if (offerDialog.open) return;
    clearTimeout(offerTimer);
    autoOfferDue = false;
    closeMenu();
    offerDialog.showModal();
    document.body.classList.add("dialog-open");
    offerShown = true;
  }

  function maybeOpenAutoOffer() {
    if (!autoOfferDue || offerShown || document.hidden) return;
    // Don't steal focus while visitors are typing or navigating the mobile menu.
    if (
      document.activeElement?.matches("input, select, textarea") ||
      galleryDialog.open ||
      navMenu.classList.contains("open")
    )
      return;
    openOffer();
  }

  function scheduleOffer() {
    const delay = 5000 + Math.floor(Math.random() * 2001);
    offerTimer = setTimeout(() => {
      autoOfferDue = true;
      maybeOpenAutoOffer();
    }, delay);
  }
  if (document.readyState === "complete") scheduleOffer();
  else window.addEventListener("load", scheduleOffer, { once: true });
  document.addEventListener("visibilitychange", maybeOpenAutoOffer);
  document.addEventListener("focusout", () => {
    // Let the browser update the active element before checking focus.
    if (autoOfferDue) setTimeout(maybeOpenAutoOffer, 0);
  });
  document.addEventListener("click", () => {
    if (autoOfferDue) maybeOpenAutoOffer();
  });
  // Native dialog provides focus trapping, Escape dismissal and focus restoration.
  document.querySelectorAll("[data-open-offer]").forEach((button) => {
    button.addEventListener("click", openOffer);
  });
  document
    .querySelector(".dialog-close")
    .addEventListener("click", () => offerDialog.close());
  offerDialog.addEventListener(
    "close",
    () =>
      !document.querySelector("dialog[open]") &&
      document.body.classList.remove("dialog-open"),
  );
  function trapDialogFocus(event, dialog) {
    if (event.key !== "Tab") return;
    const focusable = [
      ...dialog.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(
      (element) =>
        !element.matches(":disabled") && element.getClientRects().length,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  offerDialog.addEventListener("keydown", (event) =>
    trapDialogFocus(event, offerDialog),
  );
  offerDialog.addEventListener("click", (event) => {
    const rect = offerDialog.getBoundingClientRect();
    if (
      event.target === offerDialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    ) {
      offerDialog.close();
    }
  });

  // Gallery uses native modal semantics with explicit keyboard navigation.
  const galleryItems = [...document.querySelectorAll("[data-gallery-index]")];
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxCounter = document.getElementById("lightbox-counter");
  let galleryIndex = 0;

  function showGalleryImage(index) {
    galleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[galleryIndex];
    const image = item.querySelector("img");
    lightboxImage.src = image.getAttribute("src");
    lightboxImage.alt = image.alt;
    lightboxTitle.textContent = item.querySelector("strong").textContent;
    lightboxCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      // Keep the timer pending, but never stack the offer over the viewer.
      showGalleryImage(index);
      galleryDialog.showModal();
      document.body.classList.add("dialog-open");
      galleryDialog.querySelector(".lightbox-close").focus();
    });
  });
  galleryDialog
    .querySelector(".lightbox-close")
    .addEventListener("click", () => galleryDialog.close());
  galleryDialog
    .querySelector(".lightbox-prev")
    .addEventListener("click", () => showGalleryImage(galleryIndex - 1));
  galleryDialog
    .querySelector(".lightbox-next")
    .addEventListener("click", () => showGalleryImage(galleryIndex + 1));
  galleryDialog.addEventListener("keydown", (event) => {
    trapDialogFocus(event, galleryDialog);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      showGalleryImage(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  galleryDialog.addEventListener("close", () => {
    if (autoOfferDue) setTimeout(maybeOpenAutoOffer, 0);
    if (!document.querySelector("dialog[open]"))
      document.body.classList.remove("dialog-open");
  });
  galleryDialog.addEventListener("click", (event) => {
    const rect = galleryDialog.getBoundingClientRect();
    if (
      event.target === galleryDialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      galleryDialog.close();
  });

  function fieldError(field) {
    const value = field.value.trim();
    if (field.required && !value) {
      return field.tagName === "SELECT"
        ? "Please choose a cleaning service."
        : "Please fill in this field.";
    }
    if (field.name === "zip") {
      const coverage = serviceAreas.checkZip(value);
      if (!coverage.valid) return "Enter a valid 5-digit ZIP code.";
      if (!coverage.served) return outsideAreaMessage;
    }
    if (field.name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (
        !/^\+?[\d\s().-]+$/.test(value) ||
        digits.length < 7 ||
        digits.length > 15
      ) {
        return "Please enter a valid phone number (7–15 digits).";
      }
    }
    if (field.name === "name" && value.length < 2)
      return "Please enter at least 2 characters.";
    if (field.type === "email" && field.validity.typeMismatch)
      return "Please enter a valid email address.";
    return "";
  }

  function clearError(field) {
    field.removeAttribute("aria-invalid");
    const errorId = `${field.id}-error`;
    document.getElementById(errorId)?.remove();
    const remaining = (field.getAttribute("aria-describedby") || "")
      .split(" ")
      .filter((id) => id && id !== errorId);
    if (remaining.length)
      field.setAttribute("aria-describedby", remaining.join(" "));
    else field.removeAttribute("aria-describedby");
  }

  function showFieldError(field) {
    clearError(field);
    const message = fieldError(field);
    if (!message) return false;
    field.setAttribute("aria-invalid", "true");
    const error = document.createElement("p");
    error.className = "field-error";
    error.id = `${field.id}-error`;
    error.textContent = message;
    if (message === outsideAreaMessage) addContactLinks(error);
    field.insertAdjacentElement("afterend", error);
    field.setAttribute(
      "aria-describedby",
      `${field.getAttribute("aria-describedby") || ""} ${error.id}`.trim(),
    );
    return true;
  }

  function validateFields(fieldset) {
    let firstInvalid;
    fieldset.querySelectorAll("input, select, textarea").forEach((field) => {
      if (showFieldError(field)) firstInvalid ||= field;
    });
    firstInvalid?.focus();
    return !firstInvalid;
  }

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    const steps = [...form.querySelectorAll("[data-step]")];
    const progress = [...form.querySelectorAll(".form-progress li")];
    const message = form.querySelector(".form-message");
    const ready = form.querySelector(".request-ready");
    let currentStep = 1;
    let submitting = false;

    function setStep(step, focus = true) {
      currentStep = step;
      form.closest("dialog")?.scrollTo({ top: 0 });
      ready.hidden = true;
      message.textContent = "";
      form.querySelector(".form-progress").hidden = false;
      steps.forEach((fieldset, i) => {
        fieldset.hidden = i !== step - 1;
        fieldset.disabled = i !== step - 1;
      });
      progress.forEach((item, i) => {
        item.classList.toggle("is-active", i === step - 1);
        item.classList.toggle("is-complete", i < step - 1);
        if (i === step - 1) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });
      if (step === 2) {
        form.querySelector("[data-summary]").textContent =
          `${serviceNames[form.elements.service.value]} · ZIP ${form.elements.zip.value.trim()} · ${form.elements.frequency.value}`;
      }
      if (focus)
        steps[step - 1]
          .querySelector("input, select, textarea")
          .focus({ preventScroll: true });
    }

    form.querySelector("[data-next]").addEventListener("click", () => {
      if (validateFields(steps[0])) setStep(2);
    });
    form
      .querySelector("[data-back]")
      .addEventListener("click", () => setStep(1));

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => clearError(field));
      field.addEventListener("change", () => clearError(field));
      if (field.name === "zip") {
        field.addEventListener("blur", () => {
          if (field.value.trim()) showFieldError(field);
        });
      }
    });

    form.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        currentStep === 1 &&
        event.target.tagName === "INPUT"
      ) {
        event.preventDefault();
        if (validateFields(steps[0])) setStep(2);
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      // Enter in a step-one input should advance, never bypass validation.
      if (currentStep === 1) {
        if (validateFields(steps[0])) setStep(2);
        return;
      }
      if (!validateFields(steps[0])) {
        setStep(1, false);
        validateFields(steps[0]);
        return;
      }
      if (!validateFields(steps[1])) return;
      if (submitting) return;
      const payload = Object.fromEntries(
        [
          ...form.querySelectorAll("input[name], select[name], textarea[name]"),
        ].map((field) => [field.name, field.value.trim()]),
      );
      payload.source = form.id;
      const submitButton = form.querySelector('button[type="submit"]');
      const buttonLabel = submitButton.innerHTML;
      message.textContent = "";
      if (submissionEndpoint) {
        submitting = true;
        form.setAttribute("aria-busy", "true");
        submitButton.disabled = true;
        submitButton.textContent = "Submitting…";
        // Freeze inputs while sending so the UI continues to match the payload.
        steps.forEach((fieldset) => {
          fieldset.disabled = true;
        });
        try {
          const endpoint = new URL(submissionEndpoint, window.location.href);
          if (
            endpoint.protocol !== "https:" &&
            endpoint.origin !== window.location.origin
          ) {
            throw new Error("An HTTPS endpoint is required.");
          }
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) throw new Error("Submission failed.");
        } catch {
          steps[currentStep - 1].disabled = false;
          message.textContent =
            "We couldn’t send your request. Please try again. Your details are still here.";
          return;
        } finally {
          submitting = false;
          form.removeAttribute("aria-busy");
          submitButton.disabled = false;
          submitButton.innerHTML = buttonLabel;
        }
      }
      ready.querySelector("h3").textContent = "Thank you!";
      ready.querySelector("[data-thank-you-message]").textContent =
        submissionEndpoint
          ? "Your request has been received. Our team will be in touch to confirm pricing and availability."
          : "Thank you for your interest in IM Excellence Cleaning.";
      steps.forEach((fieldset) => {
        fieldset.hidden = true;
        fieldset.disabled = true;
      });
      form.querySelector(".form-progress").hidden = true;
      ready.hidden = false;
      const heading = ready.querySelector("h3");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });

    setStep(1, false);
    controllers.set(form, { setStep });
  });

  // Each service card links to a working booking anchor and preselects its service.
  document.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      controllers.get(bookingForm).setStep(1, false);
      bookingForm.elements.service.value = link.dataset.service;
      clearError(bookingForm.elements.service);
    });
  });

  // Exact owner-supplied coverage; do not infer service from ZIP prefixes.
  const areaForm = document.getElementById("area-form");
  const zipInput = document.getElementById("zipcode");
  const zipResult = document.getElementById("zip-result");
  const zipContinue = document.querySelector(".zip-continue");
  areaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!areaForm.reportValidity()) return;
    const coverage = serviceAreas.checkZip(zipInput.value);
    zipContinue.hidden = true;
    if (!coverage.served) {
      zipInput.setAttribute("aria-invalid", "true");
      zipResult.textContent = outsideAreaMessage;
      addContactLinks(zipResult);
      return;
    }
    zipInput.removeAttribute("aria-invalid");
    controllers.get(bookingForm).setStep(1, false);
    bookingForm.elements.zip.value = coverage.zip;
    clearError(bookingForm.elements.zip);
    zipResult.textContent = `Yes! We serve ${coverage.zip} (${coverage.areas.join(" / ")}). Continue to your free quote; appointment availability is confirmed separately.`;
    zipContinue.hidden = false;
  });
  zipInput.addEventListener("input", () => {
    zipInput.removeAttribute("aria-invalid");
    zipResult.textContent = "";
    zipContinue.hidden = true;
  });

  // Highlight the corresponding navigation section without affecting anchor behavior.
  if ("IntersectionObserver" in window) {
    const navLinks = [...navMenu.querySelectorAll('a[href^="#"]')];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((section) => observer.observe(section));
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
