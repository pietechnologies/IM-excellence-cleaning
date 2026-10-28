# IM Excellence Cleaning

A responsive, dependency-free cleaning services website. Static HTML, CSS and JavaScript; no build step or runtime packages. Works on GitHub Pages, including repository subpaths.

## Preview

```sh
python3 -m http.server 3000 --bind 0.0.0.0
# Or: npm start
```

Open http://localhost:3000. The preview server accepts proxy hosts and does not depend on external image, font, or icon CDNs.

## Design and interactions

- Navy, ivory, and fresh lime visual system with locally hosted Manrope fonts.
- Responsive hero, services, about, process, testimonials, neighborhood/coverage, booking, FAQ, and footer sections.
- Consistent inline SVG line icons and locally hosted full-color Instagram and Google brand icons.
- Working booking anchors; service-card links preselect the matching service.
- Main quote form and timed new-client offer dialog both use **two steps**:
  1. Service, ZIP code, and frequency.
  2. Contact information and optional notes.
- Per-step validation, inline errors, progress, back navigation, preserved values, and an email-request review state.
- Accessible mobile navigation, keyboard-friendly FAQ, focus-managed modal, reduced-motion support, and a once-per-session offer popup.

## Important: form delivery

There is **no submission backend in this repository**. No request is silently sent or stored.

After validation, both forms prepare a `mailto:` draft addressed to `hello@imexcellencecleaning.com`. Visitors review the request, select **Open email draft**, and send it in their own email app. A **Copy request** fallback is provided for visitors using webmail. The site makes clear that a booking is not confirmed until the business replies.

For automatic submissions, integrate a real form provider or backend with both forms in `js/main.js`; only display a delivery-success message after the server confirms receipt. Keep secrets out of client-side JavaScript. Confirm the recipient address is monitored before publishing.

## Coverage and business details

The old ZIP-code list was explicitly placeholder data spanning several unrelated cities. It has been removed so the site does not falsely promise coverage. The ZIP tool validates the format, copies the ZIP into the quote form, and explains that the team will confirm coverage.

The old Google share URL was not a valid embeddable Maps URL. It is now a normal external profile link beside a clearly labeled illustrative neighborhood map. A real embed can be added later using the correct Google Maps embed URL and verified address.

The placeholder `555` telephone number and broken externally hosted logo were removed. The local wordmark does not depend on that remote asset. Replace it with the approved company logo and add the verified telephone number when available.

Existing testimonials and service/trust statements have been retained from the original site, not independently verified or presented as Google-sourced reviews. Confirm them, business hours, eco-friendly practices, licensing/insurance, and the new-client offer before publishing.

## Customize

- Colors, typography, breakpoints: `css/style.css`
- Services, copy, business links, offer terms, and field labels: `index.html`
- Email recipient, service labels, form behavior: `js/main.js`
- Local image, favicon, brand icons, and fonts: `assets/`

The promotional dialog appears automatically after a random **10–15 seconds**, once per tab session. It waits while the page is hidden or a visitor is typing or using the mobile menu, and skips the automatic popup if they have started a booking or ZIP enquiry. **Claim your offer** always opens it manually. Dismissing a manually opened offer cancels the automatic appearance. Only a shown/dismissed flag is saved in `sessionStorage`; form data stays in memory and is not saved to browser storage. When storage is blocked, the popup still works once per page view.

## Tests

Requires Node.js and Python 3:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

For an existing compatible Chromium executable, set `CHROMIUM_PATH=/path/to/chromium` when running tests. Playwright's test server uses loopback locally; browser-facing app code uses relative URLs only.

The suite covers links and assets, both form steps, validation, Enter-key behavior, data preservation, mailto contents, service and ZIP prefilling, modal focus and Escape, mobile navigation, FAQ interaction, horizontal overflow at 320–1440px, and automated WCAG A/AA checks on desktop and mobile. Automated accessibility checks do not replace manual review.

## Assets

- `clean-living-room.jpg`: AI-generated editorial-style interior image; illustrative, not a photo of a client's home.
- Manrope font: SIL Open Font License, included in `assets/fonts/LICENSE`.
- Google and Instagram SVGs: original brand artwork from [SVGL](https://github.com/pheralb/svgl), with repository license in `assets/BRAND-ICONS-LICENSE.txt`. Brand trademarks belong to their respective owners; use does not imply affiliation.
- Service/interface icons: inline SVG line artwork, with no external icon-font dependency.

## GitHub Pages

Publish the repository root using your normal Pages branch configuration. No build output is required. All local asset links are relative for subpath compatibility.
