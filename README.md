# IM Excellence Cleaning

A responsive, dependency-free cleaning services website. Static HTML, CSS and JavaScript; no build step or runtime packages. Works on GitHub Pages, including repository subpaths.

## Preview

```sh
python3 -m http.server 3000 --bind 0.0.0.0
# Or: npm start
```

Open http://localhost:3000. The preview server accepts proxy hosts and does not depend on external image, font, or icon CDNs.

## Design and interactions

- Navy, ivory, and fresh lime visual system with locally hosted Inter fonts.
- Responsive hero, services, about, process, testimonials, neighborhood/coverage, booking, FAQ, and footer sections.
- Consistent inline SVG line icons and locally hosted full-color Instagram and Google brand icons.
- Working booking anchors; service-card links preselect the matching service.
- Main quote form and timed new-client offer dialog both use **two steps**:
  1. Service, ZIP code, and frequency.
  2. Contact information and optional notes.
- Per-step validation, inline errors, progress, back navigation, preserved values, and an inline thank-you state.
- Accessible mobile navigation, keyboard-friendly FAQ, focus-managed modal, reduced-motion support, and a 5–7 second offer popup on every page load and refresh.

## Form submission and thank-you messages

Both forms validate their two steps and display an inline **Thank you!** screen.
There are no email-app, draft, or copy-request instructions in either form.

**No live submission service is configured in this repository.** With the endpoint
blank, the thank-you screen explicitly states that delivery is not connected and
no request was sent. It does not falsely confirm receipt or an appointment.

To receive actual enquiries, set the `cleaning-form-endpoint` meta tag in
`index.html` to your verified JSON POST endpoint (HTTPS for external services):

```html
<meta name="cleaning-form-endpoint" content="" />
```

The endpoint receives `service`, `zip`, `frequency`, `name`, `email`, `phone`,
`notes`, and `source` (`booking-form` or `offer-form`). Fields are trimmed and
submitted together, including values from the hidden first step. Configure CORS
when using an external endpoint. Do not put credentials in this tag or the client.
The receiving service must validate input and apply spam/rate-limit protection.

When configured, only a successful HTTP response shows the receipt confirmation:
**Thank you! Your request has been received. Our team will be in touch to confirm
pricing and availability.** Pending requests disable the controls; a failure or
15-second timeout preserves the details and offers a retry rather than displaying
success. Tests mock the endpoint; they do not verify a production receiving service.

## Coverage and business details

`js/service-areas.js` is the single owner-supplied service-area registry: **70
unique ZIP codes across 10 named areas**. It preserves shared Tampa/New Tampa and
Tampa/Temple Terrace entries and does not infer coverage from neighboring ZIPs.
The registry powers the visible coverage list, ZIP checker, both form steps, and
final pre-submission validation. Unsupported ZIPs are blocked and show direct
Call/Text links; malformed ZIPs get a format error. Only exact five-digit ZIP
strings are accepted (surrounding whitespace is trimmed, ZIP+4 is not accepted).

**Server-side enforcement:** this is still a static Pages site without a receiving
backend. Client checks can always be bypassed by a direct API request. The registry
also exports a Node-compatible API, so the configured receiving service must use
`require('./js/service-areas').checkZip(payload.zip).served` (or the same exact
allowlist in its own stack) and return HTTP 422 for an unserved ZIP _before_
storing, emailing, or confirming a lead. Do not rely solely on browser validation.
No production backend validation is claimed by this change.

The old Google share URL was not a valid embeddable Maps URL. It is now a normal external profile link beside a clearly labeled illustrative neighborhood map. A real embed can be added later using the correct Google Maps embed URL and verified address.

Call and Text buttons use **(813) 316-8298**, as listed on the owner-supplied [main website](https://imexcellencecleaning.com/). The email address and business hours were also aligned with that site: `imexcellencecleaning@gmail.com`; Mon–Fri 7 AM–7 PM, Sat 8 AM–5 PM, Sun closed. The local wordmark does not depend on the old externally hosted logo.

Existing testimonials and service/trust statements have been retained from the original site, not independently verified or presented as Google-sourced reviews. Confirm testimonial permission, eco-friendly practices, licensing/insurance, and the new-client offer before publishing.

## Customize

- Colors, typography, breakpoints: `css/style.css`
- Services, copy, business links, offer terms, and field labels: `index.html`
- Service labels and form behavior: `js/main.js`
- Local image, favicon, brand icons, and fonts: `assets/`

The promotional dialog appears after a random **5–7 seconds on every full page
load or refresh**. Dismissal applies to that page view only; no session/local
storage flags are read or written. A new load starts a new timer even if an older
version left a shown flag in storage. The pending offer waits while the page is
hidden, a field is focused, the mobile menu is open, or the gallery is displayed.
It appears when those interactions finish instead of stacking dialogs or stealing
input focus. **Claim your offer** always opens it manually. Form values remain in
memory only until refresh, unless sent to a configured submission service.

## Tests

Requires Node.js and Python 3:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

For an existing compatible Chromium executable, set `CHROMIUM_PATH=/path/to/chromium` when running tests. Playwright's test server uses loopback locally; browser-facing app code uses relative URLs only.

The suite covers links and assets, both form steps, validation, Enter-key behavior, data preservation, thank-you/delivery states, service and ZIP prefilling, modal focus and Escape, mobile navigation, FAQ interaction, horizontal overflow at 320–1440px, and automated WCAG A/AA checks on desktop and mobile. Automated accessibility checks do not replace manual review.

## Assets

- `clean-living-room.jpg` and `gallery-*.jpg`: AI-generated editorial-style interiors; illustrative, not photos of client work. The gallery includes an explicit disclosure.
- Inter font: SIL Open Font License, included in `assets/fonts/INTER-LICENSE`. Legacy Manrope files are retained but no longer loaded.
- Google and Instagram SVGs: original brand artwork from [SVGL](https://github.com/pheralb/svgl), with repository license in `assets/BRAND-ICONS-LICENSE.txt`. Brand trademarks belong to their respective owners; use does not imply affiliation.
- Service/interface icons: inline SVG line artwork, with no external icon-font dependency.

## GitHub Pages

Publish the repository root using your normal Pages branch configuration. No build output is required. All local asset links are relative for subpath compatibility.

## Deployment cache safety

`index.html` loads the stylesheet and script with SHA-256 content versions
(`css/style.css?v=…` and `js/main.js?v=…`). This prevents an old cached stylesheet
or script from being reused with redesigned HTML. Asset paths remain relative,
including font URLs inside the CSS, so project Pages and custom domains work.

After changing `css/style.css` or `js/main.js`, run:

```sh
npm run version:assets
npm test
```

Commit the updated `index.html` with those changes. `npm run check:assets` and the
Site checks workflow reject mismatched asset versions. No build step is required
on Pages; keep the existing **main / root** publishing configuration.

Browser tests also serve the site at `/IM-excellence-cleaning/`, simulate stale
unversioned assets, and check that the versioned CSS, fonts, imagery, and form
scripts still load on desktop and mobile. Merge the fix into `main` to publish;
changes on a working branch do not update the live site. When checking a release,
wait for the Pages deployment to finish and refresh the page. If a browser still
shows an older document, use a hard refresh (Ctrl+Shift+R / Cmd+Shift+R).

## Gallery and popup layout

- The gallery is linked from the navigation and footer and contains living-room,
  kitchen, bathroom, and bedroom imagery. Replace these illustrative files with
  approved, consented client photos when available; update alt text and remove
  the AI disclosure only when it no longer applies.
- Clicking a gallery tile opens a native modal lightbox with next/previous
  buttons, wrapping Arrow-key navigation, Escape/backdrop dismissal, focus
  trapping, and focus return. The timed offer waits until the gallery closes so
  dialogs cannot interrupt each other.
- All Google profile/Maps buttons link to
  `https://maps.app.goo.gl/nM1auwHershaoVy47`.
- The offer popup uses a compact two-step layout. Optional phone/notes are in an
  expandable section; both default steps fit common phone and desktop screens
  without scrolling. Scrolling is retained when genuinely needed on short
  screens, with a keyboard open, with expanded extras, or with validation errors;
  content is never clipped just to hide the scrollbar.

## Readability and local contact

Inter is hosted locally in weights 400, 600, 700 and 800. Body text is 16px;
service descriptions are at least 15px; footer links are 14px and copyright is
13px. Secondary text has been increased across breakpoints rather than remaining
at the old 8–11px sizes. Navigation switches to a menu on narrower desktop/tablet
screens; footer/contact columns reflow instead of squeezing the text.

Call/Text actions appear by the hero, booking form, service area, footer, and
unsupported-ZIP errors. Coverage does not guarantee an available appointment;
pricing and dates are still confirmed by the team. Form delivery configuration
and the 5–7 second per-load popup behavior are unchanged.
