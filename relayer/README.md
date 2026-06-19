# Flappy Bull Relayer

Cloudflare Worker that pays + broadcasts the base-layer txs so players need
**zero devnet SOL**. The player signs one off-chain message at connect; the
Worker is the only authorization gate.

Endpoints (all POST except `/health`, CORS-pinned to `ALLOWED_ORIGIN`):

| Route          | Body                                  | Does                                                            |
|----------------|---------------------------------------|----------------------------------------------------------------|
| `/start`       | `{player, roomId, message, signature}`| mint session key → `start_run` + `delegate` (payer=relayer)    |
| `/session-key` | `{player, message, signature}`        | return the stored ephemeral session key for re-request         |
| `/settle`      | `{player, message, signature}`        | `update_leaderboard` only if finished, unsettled, top-10       |
| `/health`      | —                                     | relayer devnet balance (monitor for running dry)               |

Auth message: `flappy-bull:connect:<playerBase58>:<nonce>:<expiryUnix>`, signed
by the player wallet, reused until expiry.

## Deploy

```sh
bun install

# KV namespaces — paste the returned ids into wrangler.toml
wrangler kv namespace create NONCES
wrangler kv namespace create SESSIONS

# Relayer hot key: a FRESH devnet keypair (NOT the test player wallet, NOT any
# mainnet key). RELAYER_SECRET_KEY is the keypair file's JSON byte array.
solana-keygen new --no-bip39-passphrase -o relayer-devnet.json
wrangler secret put RELAYER_SECRET_KEY   # paste the contents of relayer-devnet.json
solana airdrop 2 $(solana-keygen pubkey relayer-devnet.json) --url devnet

wrangler deploy
```

Then set the deployed `workers.dev` URL into `app/src/lib/connections.ts`
(`RELAYER`) and confirm `ALLOWED_ORIGIN` matches the Netlify origin.

Top up when low: `solana airdrop 2 <RELAYER_PUBKEY> --url devnet` (watch
`/health`). The Worker rejects `/start` below a 0.02 SOL floor.

> Devnet-only, low-stakes hot key. The session keys in `SESSIONS` KV authorize
> ER taps only (never the wallet); never reuse this pattern for value-bearing
> keys or on mainnet.
