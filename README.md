# GymKey website

Static HTML/CSS/JavaScript single-product prelaunch site. The opening screen uses a transparent, high-resolution GymKey cutout with a provisional A$89 including-GST offer, quantity selection from 1–10 and a live total. Below it, a real WebGL model loads the checked-in front, back and lime-insert STL geometry: scrolling turns the model through 360 degrees, while pointer, touch and arrow-key controls allow free orbit. Scroll-driven motion is disabled when the visitor requests reduced motion.

The testimonial carousel is deliberately populated with clearly labelled beta placeholders, not invented customer claims. Replace those slides only with permissioned, verified tester quotes. The FAQ uses native `details` elements and keeps only one answer open at a time.

Three.js 0.185.1 and the required STL/Orbit modules are vendored under `vendor/three/` with the upstream MIT licence. The WebGL viewer does not depend on a third-party CDN at runtime. Checkout remains unavailable until a server-side Stripe Checkout Session endpoint is connected, so the current page cannot take payment.

The shell and lime insert in the 3D viewer use the checked-in CAD geometry. The flexible tether and steel split ring are lightweight procedural visual approximations for the storefront, not manufacturing CAD.

## Stripe wiring seam

Set the single `data-checkout-endpoint` value on the `<body>` in `index.html` to an HTTPS endpoint that:

1. accepts `POST { "sku": "gymkey", "quantity": 1 }`;
2. validates quantity server-side as an integer from 1–10;
3. creates a Stripe Checkout Session using a server-held price ID and secret key; and
4. returns `200 { "url": "https://checkout.stripe.com/..." }`.

Never place a Stripe secret key or trusted price amount in this static repository. The endpoint must calculate the price from its own trusted product configuration. Until the data attribute is non-empty, the checkout button stays disabled and the page states that no payment is taken.

## Local preview

```sh
python3 -m http.server 4197 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:4197/`.

## Deployment

This directory is published as the standalone public `gymkey-site` repository. Its local `.github/workflows/pages.yml` workflow deploys the site to GitHub Pages. No build step or paid service is required. Connect and test the server-side Stripe endpoint before enabling checkout.
