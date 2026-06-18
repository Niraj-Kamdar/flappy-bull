# scripts/

Operational scripts for the flappy_bull program. All target **devnet**.

| Script | npm | Purpose |
| --- | --- | --- |
| `deploy-devnet.sh` | `npm run deploy` | Build sbpf **v3** + verify + deploy to devnet. See [../DEPLOYMENT.md](../DEPLOYMENT.md). |
| `init-program.mjs` | `npm run init` | Bootstrap a freshly deployed program: `init_leaderboard` + `init_room(0)` (desktop) + `init_room(1)` (mobile). Idempotent (`init_if_needed` rooms; leaderboard skipped if present). Reads the program ID from `target/deploy/flappy_bull-keypair.json`. |
| `convert-idl.py` | — | Convert an Anchor 1.0 IDL (`target/idl/…json`) to the Anchor 0.30 shape used by `@coral-xyz/anchor@0.32.1`. |
| `idl-to-ts.mjs` | — | Wrap `app/src/idl/*.json` into Anchor-style `.ts` type helpers. |

## Typical flow after a program change

```bash
npm run build        # anchor build -> target/idl/flappy_bull.json (Anchor 1.0 IDL)
python3 scripts/convert-idl.py target/idl/flappy_bull.json app/src/idl/flappy_bull.json
node scripts/idl-to-ts.mjs     # regenerate app/src/idl/flappy_bull.ts
npm run deploy       # build v3 + deploy
npm run init         # init leaderboard + rooms on the new program (first deploy only)
```
