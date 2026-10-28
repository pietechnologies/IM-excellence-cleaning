# IM Excellence Cleaning — Landing Page

Professional, GitHub Pages–ready landing page for **IM Excellence Cleaning**.

## Features

- Responsive, professional design (mobile-friendly)
- Sticky navigation with smooth scrolling
- Hero section, services, about, testimonials, and contact/booking sections
- **Service area checker** — enter a zip code to see if we service your area
- **Auto popup form** — appears automatically 10–15 seconds after page load (once per visitor), offering 10% off the first cleaning
- Logo loaded from `https://imexcellencecleaning.com/assets/logo-C-ImsENA.png`
- Static HTML/CSS/JS — no build step or backend required

## Files

```
index.html        # Landing page
css/style.css     # Styles
js/main.js        # Interactions (popup timer, zip checker, forms, nav)
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **Deploy from a branch**.
4. Choose branch `main` (or `arena/c94a32b1-im-excellence-cleaning`) and folder `/ (root)`.
5. Click **Save**. Your site will be published at `https://<user>.github.io/<repo>/` (or your custom domain).

## Customizing

- **Service area zip codes:** Edit the `SERVED_ZIPS` list in `js/main.js` with your real service zips.
- **Brand colors:** Edit CSS variables in `:root` inside `css/style.css`.
- **Logo:** The logo is loaded from `https://imexcellencecleaning.com/assets/logo-C-ImsENA.png`. To self-host, download the image, place it in `assets/`, and update the `src` attributes in `index.html`.
- **Form backend:** Forms currently simulate submission with a success message. To receive real submissions, point the forms at [Formspree](https://formspree.io/), [Netlify Forms](https://www.netlify.com/products/forms/), or your own backend.
