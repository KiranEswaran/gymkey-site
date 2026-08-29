# GymKey website

Static HTML/CSS/JavaScript prelaunch site. It is deliberately honest about the current product boundary: the experience exists, while physical NFC and Apple Screen Time distribution are still being validated.

## Local preview

```sh
python3 -m http.server 4197 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:4197/`.

## Deployment

This directory is published as the standalone public `gymkey-site` repository. Its local `.github/workflows/pages.yml` workflow deploys the site to GitHub Pages. No build step, secret, subscription, form backend, or paid service is required.
