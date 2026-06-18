# Submit Flappy Bull to the Solana dApp Store

The dApp Store moved to a **portal-backed** flow. Listing metadata + the App NFT
are created in the web portal; the CLI (`@solana-mobile/dapp-store-cli`, installed)
only uploads the signed APK as a version. NFT minting happens inside the portal —
you do not run the old `config.yaml` / `dapp-store create publisher` commands.

Ready in this repo:
- Signed APK: `seeker/app-release-signed.apk` (also `.aab`)
- Icon: `seeker/media/icon-512.png`
- Feature graphic: `seeker/media/feature.png`
- Screenshots: `seeker/media/screenshots/*.png`
- Listing copy: `seeker/LISTING.md`

## One-time portal setup (your account + wallet)
1. Go to **https://publish.solanamobile.com**, sign in / connect your wallet.
2. Create a **Publisher** (name: Metasquare Studio) — mints the publisher NFT.
3. Create an **App** — package `app.netlify.flappy_bull.twa`. This mints the App
   NFT (small mainnet SOL cost; the portal handles the transaction in your wallet).
4. Fill the listing from `LISTING.md` and upload media from `seeker/media/`.
5. Generate an API key at
   **https://publish.solanamobile.com/dashboard/settings/api-keys**.

## Publish the APK version (CLI)
```bash
cd seeker
export DAPP_STORE_API_KEY=<key-from-portal>
dapp-store \
  --apk-file ./app-release-signed.apk \
  --keypair  </path/to/your-mainnet-keypair.json> \
  --whats-new "First release of Flappy Bull — fly the bull through the live SOL price channel and claim your spot on the on-chain leaderboard."
```
- The CLI auto-extracts the package name and matches it to your portal app.
- Resume an interrupted upload: `dapp-store resume --release-id <id>`.

## Then
Submit for review in the portal. Review takes ~3–5 business days; on approval the
app goes live in the Games category on the Seeker / Saga dApp Store.

## Notes
- Keystore that signed this APK lives at `seeker/android.keystore` (gitignored).
  Keep it + its password — required to ship every future update.
- The game runs on **devnet**; only the portal publisher/app NFTs touch mainnet.
