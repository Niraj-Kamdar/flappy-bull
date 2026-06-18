# Seeker / Solana dApp Store — Build & Publish Runbook

Flappy Bull is a PWA. The Solana dApp Store ships **APKs**, so we wrap the PWA in a
Trusted Web Activity (TWA) with Bubblewrap. The APK is a fullscreen shell that loads
the live site at `https://flappy-bull.netlify.app` — WASM, PixiJS, RPC all run as in
mobile Chrome.

What's already done in the repo (code side):
- `app/vite.config.ts` — `vite-plugin-pwa` (manifest + service worker, wasm precached)
- `app/index.html` — theme-color + apple-touch-icon
- `app/src/main.tsx` — `registerMwa(...)` (Mobile Wallet Adapter, devnet)
- `app/public/icons/` — authored icon set (192 / 512 / maskable-512 / apple-touch-180)
- `app/public/_redirects` — `/.well-known/*` pass-through above SPA fallback
- `seeker/twa-manifest.json` — prefilled Bubblewrap config (this dir)

Prereqs you provide at run time: JDK 17 (Bubblewrap auto-installs one if missing),
Android SDK (Bubblewrap auto-installs), a keystore password (you choose), a funded
**mainnet** keypair for the dApp Store NFTs (~0.1 SOL), and Netlify deploy access.

---

## 1. Deploy the PWA (must happen before APK)

Bubblewrap fetches the manifest over HTTPS and Digital Asset Links must serve from the
same origin. Build + deploy `app/dist` to `flappy-bull.netlify.app`:

```bash
cd app && bun run build       # emits dist/ with sw.js + manifest.webmanifest
# deploy dist/ via your existing Netlify pipeline (git push, or: netlify deploy --prod --dir=dist)
```

Verify after deploy:
- https://flappy-bull.netlify.app/manifest.webmanifest  → JSON
- Lighthouse → PWA "Installable" + "PWA optimized" pass

## 2. Build the signed APK

```bash
cd seeker
# init pulls the prefilled twa-manifest.json, generates the Android project + keystore.
# (It will prompt for keystore + key passwords — STORE THESE; losing them blocks updates.)
bubblewrap init --manifest https://flappy-bull.netlify.app/manifest.webmanifest
# When asked, point it at ./twa-manifest.json or accept and then overwrite with ours.
bubblewrap build            # → app-release-signed.apk  +  app-release-bundle.aab
```

Back up `seeker/android.keystore` + passwords somewhere safe (not git).

## 3. Digital Asset Links (removes the URL bar)

```bash
cd seeker
bubblewrap fingerprint generateAssetLinks   # writes assetlinks.json (package + SHA-256)
cp assetlinks.json ../app/public/.well-known/assetlinks.json
cd ../app && bun run build   # then redeploy (step 1)
```

Verify: `curl -s https://flappy-bull.netlify.app/.well-known/assetlinks.json` returns
**JSON** (not the SPA index.html). The `/.well-known/*` rule in `_redirects` guarantees this.

## 4. Sideload test on Seeker

```bash
adb install seeker/app-release-signed.apk
```
Confirm: launches fullscreen (no URL bar after asset-link verify), game renders, live
SOL ticker updates, wallet modal shows **Mobile Wallet Adapter** → Seed Vault connects,
score submits on devnet.

## 5. Submit to the Solana dApp Store (3–5 day review)

```bash
npx @solana-mobile/dapp-store-cli@latest init        # scaffolds config.yaml
# fill config.yaml: name, descriptions, category=games, screenshots, the .aab/.apk path,
# icon (icons/icon-512.png), publisher details.
# NFTs mint on MAINNET — needs a funded mainnet keypair:
npx dapp-store create publisher -k <mainnet-keypair.json> -u <mainnet-rpc>
npx dapp-store create app       -k <mainnet-keypair.json> -u <mainnet-rpc>
npx dapp-store create release   -k <mainnet-keypair.json> -u <mainnet-rpc>
npx dapp-store publish submit   -k <mainnet-keypair.json> -u <mainnet-rpc> --requestor-is-authorized
```
Screenshots: repo root `demo.png` is a starting asset; capture more from the Seeker run.

---

## Notes / gotchas
- **Devnet game, mainnet store NFTs.** The game RPC stays devnet; only the dApp Store
  publisher/app/release NFTs live on mainnet-beta.
- **Keystore is forever.** It binds to assetlinks; lose it and you can't update the listing.
- **Never runtime-cache RPC** — the service worker only caches static assets + fonts.
- Re-releases: bump `appVersionCode` in `twa-manifest.json`, `bubblewrap update`, rebuild.
