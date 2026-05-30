# Deploy: pancake-calculator → homeserver

You are Claude running on the **homeserver (192.168.0.3)**. Your job is to deploy this
repo as a static website, served by nginx in Docker, reachable at
**`https://pancake.famknaepen.be`** behind **tinyauth**, via the existing
**Traefik + Cloudflare Tunnel** stack.

This document assumes you know nothing about this repo. Everything you need is here.
Where a value is environment-specific (network names, cert resolver, middleware names),
**copy it from an existing working service** rather than guessing — see Step 3.

---

## What this app is

A single static page (no backend, no build step):

```
index.html  styles.css  app.js  manifest.json
```

It is a protein-pancake recipe calculator: the user types their weighed banana in
grams and every other ingredient + total calories scales live, all client-side.
The `Dockerfile` copies those four files into `nginx:alpine`. That's the whole app.

There is nothing to compile and no environment variables the app needs.

---

## Conventions to follow (this server)

- Compose files live at `/opt/docker/docker-compose.<stack>.yml` with a header comment
  and standard env vars (`DOCKER_DATA`, `TZ`).
- Traefik uses **file-based** routing (more reliable here than Docker label discovery)
  at `/opt/docker/data/traefik/dynamic/trident.yml`.
- Public hostnames are under `famknaepen.be`, fronted by Cloudflare Tunnel + Traefik,
  with **tinyauth** middleware on protected routes.

---

## Step 1 — Get the source

Clone the repo to a stable location the compose file can build from:

```bash
git clone https://github.com/MaartenKnaepen/pancake-calculator.git \
  /opt/docker/apps/pancake-calculator
```

For later updates: `git -C /opt/docker/apps/pancake-calculator pull` then rebuild
(Step 5).

---

## Step 2 — Compose file

Create `/opt/docker/docker-compose.pancake.yml`:

```yaml
# pancake-calculator — static recipe calculator served by nginx.
# Reachable at https://pancake.famknaepen.be (Traefik file-based router + tinyauth).
services:
  pancake:
    build: /opt/docker/apps/pancake-calculator
    image: pancake-calculator:latest
    container_name: pancake
    restart: unless-stopped
    environment:
      - TZ=${TZ:-Europe/Brussels}
    networks:
      - PLACEHOLDER_TRAEFIK_NETWORK   # ← see Step 3: the network Traefik shares with services

networks:
  PLACEHOLDER_TRAEFIK_NETWORK:
    external: true
```

The container listens on port 80 internally; do **not** publish a host port — Traefik
reaches it over the shared network.

> **Fill `PLACEHOLDER_TRAEFIK_NETWORK`** with the actual external network the other
> Traefik-fronted services use. Find it by inspecting an existing compose file in
> `/opt/docker/` (e.g. `grep -A3 'networks:' /opt/docker/docker-compose.*.yml`) or
> `docker network ls`.

---

## Step 3 — Traefik router (file-based)

Open `/opt/docker/data/traefik/dynamic/trident.yml`. Find an **existing public service
that already sits behind tinyauth** (e.g. the hindsight-ui or syncthing router) and use
it as your template so the environment-specific names are guaranteed correct.

Add a router + service mirroring that template. Conceptually:

```yaml
http:
  routers:
    pancake:
      rule: "Host(`pancake.famknaepen.be`)"
      entryPoints: [ COPY_FROM_EXISTING ]        # e.g. websecure / web — match neighbours
      service: pancake
      middlewares: [ COPY_TINYAUTH_MIDDLEWARE ]  # the same tinyauth middleware ref others use
      tls: COPY_FROM_EXISTING                     # certresolver block, if neighbours use one

  services:
    pancake:
      loadBalancer:
        servers:
          - url: "http://pancake:80"              # container_name from Step 2, port 80
```

Key point: the `services.pancake.loadBalancer.servers.url` must resolve to the
container. `http://pancake:80` works because Traefik and the container share the network
from Step 2. If existing services reference containers by a different scheme, match it.

**Do not invent** the entrypoint name, tinyauth middleware name, or TLS/certresolver
block — copy them verbatim from a neighbouring router in the same file.

---

## Step 4 — Cloudflare DNS

Add a DNS record so `pancake.famknaepen.be` routes through the same Cloudflare Tunnel as
your other public hostnames. Mirror an existing `*.famknaepen.be` record exactly (same
tunnel target / CNAME, proxied status). If the tunnel uses a wildcard host rule that
already covers `*.famknaepen.be`, no new record is needed — verify before adding one.

---

## Step 5 — Build and start

```bash
docker compose -f /opt/docker/docker-compose.pancake.yml up -d --build
```

Traefik picks up the file-based router automatically (no restart needed). On later
source updates: `git -C /opt/docker/apps/pancake-calculator pull` then re-run the command
above.

---

## Step 6 — Verify

1. **Container healthy**
   ```bash
   docker ps --filter name=pancake
   ```
2. **Served internally** (from the homeserver, over the Traefik network or a temporary
   port-forward) — `curl` the container should return the HTML:
   ```bash
   docker exec pancake wget -qO- http://localhost:80/ | head -n 5
   ```
   Expect `<!DOCTYPE html>` and `<title>Protein Pancakes</title>`.
3. **Public route** — open `https://pancake.famknaepen.be` in a browser. You should hit
   the **tinyauth** login first, then the black-and-orange calculator.
4. **Functional check** — the banana field defaults to **820**. Confirm the page shows:
   Egg whites **671 g**, Protein powder **123 g**, Rolled oats **242 g**, Cocoa powder
   **56 g**, Cinnamon **3.73 tsp**, Total **2684 kcal**. These are the known-good values
   from the original spreadsheet; if they match, the math is correct.

---

## Rollback

```bash
docker compose -f /opt/docker/docker-compose.pancake.yml down
```

Then remove the `pancake` router/service block from `trident.yml` and the Cloudflare DNS
record if you added one.
