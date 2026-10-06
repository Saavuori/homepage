# Deployment

Same pipeline as the sibling apps (`ratikka`, `Fintraffic`, `FinStats`): GitHub
Actions builds a multi-arch image on every push to `main`, and the Oracle host
pulls and redeploys it on a cron.

## Pipeline

1. **Push to `main`** (with changes outside docs/scripts/deploy).
2. **`.github/workflows/docker-build.yml`**:
   - `mathieudutour/github-tag-action` bumps the version and pushes a git tag
     (default bump: `patch`).
   - Buildx builds `linux/amd64` + `linux/arm64` from the root `Dockerfile` and
     pushes `latest`, the new `vX.Y.Z` and the commit SHA to
     `ghcr.io/saavuori/homepage`.
   - `VERSION`, `BUILD_DATE`, `GIT_SHA` are baked in via `-ldflags` and shown
     at `/api/version` (and in the page footer).
3. **`.github/workflows/deploy-pages.yml`** (only when `CHANGELOG.md` or the
   changelog tooling changes): publishes the changelog to
   `https://saavuori.github.io/homepage/`.

## Host (Oracle, rootless Podman)

A single stateless container. TLS is terminated by the Caddy container in the
*ratikka* stack, which reverse-proxies the domain to this container over the
shared external `web-proxy` podman network.

```
                    :443  ┌───────────────────────┐
saavuori.live ───────────▶│ ratikka_ratikka-caddy │──▶ homepage:8080
www.saavuori.live ──301──▶│                       │     (web-proxy network)
                          └───────────────────────┘
```

### DNS

`saavuori.live` is at GoDaddy. The apex `@` A record points at the Oracle host
(`130.61.41.177`); `www` is a CNAME to `@`.

### First-time setup

On the host, with DNS already pointing at it:

```bash
curl -fsSL https://raw.githubusercontent.com/Saavuori/homepage/main/deploy/install.sh -o ~/install-homepage.sh
bash ~/install-homepage.sh saavuori.live
```

`install.sh` is idempotent. It copies `docker-compose.yml` + `update.sh` to
`~/homepage`, makes sure the `web-proxy` network exists, pulls and starts the
container, appends the site blocks to the shared Caddyfile (backing it up
first) and reloads Caddy, registers the 5-minute cron, and health-checks the
container. The Caddy blocks it adds:

```
saavuori.live {
    reverse_proxy homepage:8080
    encode gzip zstd
}

www.saavuori.live {
    redir https://saavuori.live{uri} permanent
}
```

Set `WWW_REDIRECT=0` to skip the `www` block, `SKIP_CRON=1` to skip the cron,
and `CADDYFILE=` / `CADDY_CONTAINER=` to override autodetection.

**Caddyfile caveat on the Oracle host:** `~/ratikka/Caddyfile` is a single-file
read-only bind mount. Edit it in place (append or `cat new > Caddyfile`), never
with `sed -i`/`mv`, or the container keeps reading the old inode. `install.sh`
only appends, which is safe.

### Updates

`~/homepage/update.sh` runs every 5 minutes, pulls `:latest`, and does a full
`down`/`up -d` when the image ID changed. Its log is `~/homepage/update.log`
(trimmed automatically).

## The status probe

The container requests each app's public `https://<app>.saavuori.live/`, which
from the host goes out and back in through the public IP to Caddy. If the board
ever shows every app as down while they work from outside, check that the
container can reach the host's public address:

```bash
podman exec homepage wget -qO- https://hsl.saavuori.live/ >/dev/null && echo ok
podman logs --tail 20 homepage    # the prober logs every failed check
```
