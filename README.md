# Pancake Calculator

A mobile-first protein-pancake recipe calculator. Weigh your banana, type the grams,
and every other ingredient + the total calories scales live. Built to prop up next to
the stove while cooking — big numbers, high contrast, no fuss.

Pure static page: `index.html` + `styles.css` + `app.js`. No backend, no build step.

## The recipe

Anchored on **banana = 220 g** (base recipe, 720 kcal). Everything scales by
`weighed_banana / 220`:

| Ingredient     | Base (per 220 g banana) |
|----------------|-------------------------|
| Egg whites     | 180 g                   |
| Protein powder | 33 g                    |
| Rolled oats    | 65 g                    |
| Cocoa powder   | 15 g                    |
| Cinnamon       | 1 tsp                   |
| **Calories**   | **720 kcal**            |

To change the recipe, edit the `INGREDIENTS` constant in `app.js`.

## Run locally

Just open `index.html` in a browser. Or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Runs as an `nginx:alpine` container (see `Dockerfile`). Full homeserver deployment
instructions — Traefik router, tinyauth, Cloudflare DNS — are in
[`docs/homeserver-deploy.md`](docs/homeserver-deploy.md).

## Designs

The chosen direction (dark kitchen-display) is the production app itself.
`designs/brutalist-card.html` keeps the alternative that was explored but not taken,
for reference.
