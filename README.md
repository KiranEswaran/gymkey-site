# GymKey website

Static HTML/CSS/JavaScript one-screen prelaunch site. It shows one product, one promise and one waitlist action without page scrolling. The current email form is presentation and validation only until a response endpoint is connected; it does not claim success or retain an address.

## Local preview

```sh
python3 -m http.server 4197 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:4197/`.

## Deployment

This directory is published as the standalone public `gymkey-site` repository. Its local `.github/workflows/pages.yml` workflow deploys the site to GitHub Pages. No build step or paid service is required. Connect a form endpoint before using the page to collect a public waitlist.
