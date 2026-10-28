/* ============================================================
   IM Excellence Cleaning — Site Scripts
   - Mobile nav
   - Sticky navbar
   - Zip code service-area checker
   - Auto popup form after 10–15 seconds (once per session)
   - Contact / popup form handling (no backend; demo-ready)
   ============================================================ */

(function () {
  'use strict';

  // ---------- Elements ----------
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-menu a');

  const zipInput = document.getElementById('zipcode');
  const checkZipBtn = document.getElementById('check-zip');
  const zipResult = document.getElementById('zip-result');

  const bookingForm = document.getElementById('booking-form');
  const formMessage = document.getElementById('form-message');
  const formSubmit = document.getElementById('form-submit');

  const popup = document.getElementById('popup');
  const popupClose = document.querySelector('.popup-close');
  const popupForm = document.getElementById('popup-form');
  const popupMessage = document.getElementById('popup-message');
  const popupSubmit = document.getElementById('popup-submit');

  // ---------- Service area data ----------
  // UPDATE THIS LIST with the real zip codes IM Excellence Cleaning serves.
  const SERVED_ZIPS = new Set([
    '10001','10002','10003','10004','10005','10006','10007','10009','10010',
    '10011','10012','10013','10014','10016','10017','10018','10019','10020',
    '10021','10022','10023','10024','10025','10026','10027','10028','10029',
    '10030','10031','10032','10033','10034','10035','10036','10037','10038',
    '10039','10040','10044','10065','10069','10075','10128','10070','10019',
    '90001','90002','90003','90004','90005','90006','90007','90008','90010',
    '90011','90012','90013','90014','90015','90016','90017','90018','90019',
    '90020','90021','90023','90024','90025','90026','90027','90028','90029',
    '90031','90032','90033','90034','90035','90036','90037','90038','90039',
    '90040','90041','90042','90043','90044','90045','90046','90047','90048',
    '90049','90057','90061','90062','90063','90064','90066','90067','90068',
    '90069','90071','90077','90094','90210','90211','90212','90230','90232',
    '90245','90250','90265','90272','90277','90278','90280','90291','90292',
    '60007','60018','60056','60077','60601','60602','60603','60604','60605',
    '60606','60607','60608','60609','60610','60611','60612','60613','60614',
    '60615','60616','60617','60618','60619','60620','60621','60622','60623',
    '60624','60625','60626','60628','60629','60630','60631','60632','60634',
    '60636','60637','60638','60639','60640','60641','60642','60643','60644',
    '60645','60646','60647','60649','60651','60652','60653','60654','60655',
    '60656','60657','60659','60660','60661','33101','33109','33125','33126',
    '33127','33128','33129','33130','33131','33132','33133','33134','33135',
    '33136','33137','33138','33139','33140','33141','33142','33143','33145',
    '33146','33147','33149','33150','33154','33155','33156','33157','33161',
    '33165','33166','33167','33168','33169','33170','33172','33173','33174',
    '33175','33176','33177','33178','33179','33180','33181','33182','33183',
    '33184','33185','33186','33187','33189','33190','33193','33194','33196'
  ]);

  const ZIP_ERRORS = {
    required: 'Please enter your zip code.',
    invalid: 'Please enter a valid 5-digit zip code.',
  };

  // ---------- Helpers ----------
  function setResult(el, text, type) {
    el.textContent = text;
    el.className = 'result ' + (type || 'info');
  }

  function isValidZip(value) {
    return /^\d{5}$/.test(String(value).trim());
  }

  function checkZip(zip) {
    zip = String(zip).trim();
    if (!zip) {
      setResult(zipResult, ZIP_ERRORS.required, 'error');
      return;
    }
    if (!isValidZip(zip)) {
      setResult(zipResult, ZIP_ERRORS.invalid, 'error');
      return;
    }
    if (SERVED_ZIPS.has(zip)) {
      setResult(zipResult, 'Great news! We service zip code ' + zip + '. Book your cleaning today.', 'success');
    } else {
      setResult(zipResult, 'Zip code ' + zip + ' is not in our current service area. We are expanding soon — check back or call us!', 'error');
    }
  }

  // ---------- Zip checker interactions ----------
  if (checkZipBtn && zipInput && zipResult) {
    checkZipBtn.addEventListener('click', () => checkZip(zipInput.value));

    zipInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); checkZip(zipInput.value); }
    });

    zipInput.addEventListener('input', () => {
      zipResult.textContent = '';
      zipResult.className = 'result';
    });
  }

  // ---------- Mobile nav ----------
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Close mobile menu on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (navMenu) navMenu.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      closePopup();
    }
  });

  // ---------- Sticky navbar shadow on scroll ----------
  if (navbar) {
    const updateNavbar = () => {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = 'var(--shadow-sm)';
      } else {
        navbar.style.boxShadow = '';
      }
    };
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // ---------- Popup form ----------
  const POPUP_KEY = 'imex_popup_shown';
  const POPUP_DELAY_MIN = 10000; // 10 seconds
  const POPUP_DELAY_MAX = 15000; // 15 seconds

  function openPopup() {
    if (popup) popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    if (popup) popup.classList.remove('open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function schedulePopup() {
    const delay = Math.floor(Math.random() * (POPUP_DELAY_MAX - POPUP_DELAY_MIN + 1)) + POPUP_DELAY_MIN;
    setTimeout(() => {
      const alreadyShown = localStorage.getItem(POPUP_KEY) === '1';
      if (!alreadyShown) openPopup();
    }, delay);
  }

  // Close on outside click
  if (popup) {
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup();
    });
  }

  if (popupClose) {
    popupClose.addEventListener('click', closePopup);
  }

  // Schedule the auto popup once DOM is ready
  if (popup) schedulePopup();

  // ---------- Form submission helpers ----------
  function submitFormDemo(form, submitBtn, messageEl, onSuccess) {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!submitBtn || !messageEl) return;

      // Simple client-side validation
      const required = form.querySelectorAll('[required]');
      let missing = null;
      required.forEach((field) => {
        if (!field.value.trim()) missing = field;
      });
      if (missing) {
        missing.focus();
        setResultMsg(messageEl, 'Please fill out all required fields.', 'error');
        return;
      }

      // Email validation when present
      const emailField = form.querySelector('input[type="email"]');
      if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
        emailField.focus();
        setResultMsg(messageEl, 'Please enter a valid email address.', 'error');
        return;
      }

      // Simulate network request
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        setResultMsg(messageEl, 'Thanks! Your request has been sent. We’ll contact you shortly.', 'success');
        form.reset();
        if (onSuccess) onSuccess();
      }, 1200);
    });
  }

  function setResultMsg(el, text, type) {
    el.textContent = text;
    el.className = 'form-message ' + (type || '');
  }

  submitFormDemo(bookingForm, formSubmit, formMessage);
  submitFormDemo(popupForm, popupSubmit, popupMessage, () => {
    localStorage.setItem(POPUP_KEY, '1');
    closePopup();
  });

  // ---------- Footer year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
