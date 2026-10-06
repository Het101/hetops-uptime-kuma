# HetOps Status

This fork is [Uptime Kuma](https://github.com/louislam/uptime-kuma) with a HetOps visual layer, served at [status.hetops.dev](https://status.hetops.dev). It tracks the latest **stable** upstream release (currently **2.5.5**), not upstream `master`.

## What is ours

The redesign is kept small and in one place, so upstream updates merge with few or no conflicts.

| File | Change |
|---|---|
| `src/hetops/theme.scss` | **The whole visual layer**: fonts, surfaces, buttons, header, monitor list, stats, sign-in, public status page, motion. Selectors start with `#app` / `body.dark #app` so they outrank Kuma's scoped styles. |
| `src/hetops/fonts/` | Archivo and JetBrains Mono (self-hosted, same as every HetOps site). |
| `src/assets/vars.scss` | Token **values** only (names unchanged). Heartbeat bars read these through Bootstrap's CSS variables. |
| `src/main.js` | One line: `import "./hetops/theme.scss"`. |
| `src/layouts/Layout.vue` | The header brand (logo and "HetOps Status"). |
| `src/components/Login.vue` | The sign-in heading. |
| `src/components/PingChart.vue` | Chart colours (values only). |
| `src/mixins/theme.js` | Dark by default. |
| `index.html`, `public/manifest.json`, `public/icon*`, `public/favicon.ico`, `public/apple-touch-icon.png` | Title, description and the HetOps Status icon (`public/icon.svg` is the master). |
| `.github/workflows/docker-publish.yml` | Builds the multi-arch image and pushes it to Docker Hub as `<user>/hetops-status` on every push to `master`. |

Not changed: `appName` (the server uses it in notification messages), and all behaviour.

## Palette

| Token | Value | Used for |
|---|---|---|
| `$primary` | `#6ea112` | Brand and "up" (the HetOps Status icon). Dark text on it. |
| `$danger` | `#cf3a3c` | Down. White text on it (4.9:1). |
| `$warning` | `#e3a944` | Pending. |
| `$maintenance` | `#3d6cd6` | Maintenance. |
| Surfaces | `#08090a` page, `#111214` panels, `#222428` lines | Shared with every HetOps product. |

Status is never colour alone: every badge and banner also carries text and an icon.

## Updating to a new upstream release

```sh
git remote add upstream https://github.com/louislam/uptime-kuma.git   # once
git fetch upstream --tags
git checkout -b update/2.x.y
git merge 2.x.y            # the release tag, never upstream/master
npm ci && npm run build    # then check the dashboard, a monitor and /status/<slug>
```

Conflicts, if any, are in the files in the table above; keep upstream's structure and re-apply our values. Back up the data volume before deploying: upstream releases can migrate the database.

## Operating status.hetops.dev

- **Public page at the root:** Settings → General → Entry Page → **Status Page – HetOps Status**. Visitors then land on the public page; the dashboard stays at `/dashboard` behind sign-in.
- **Status page settings** (Edit Status Page): theme **Dark**, "Show Powered By" off, footer text `Part of [HetOps](https://hetops.dev) · [hetops.dev](https://hetops.dev)`.
