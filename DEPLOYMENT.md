# Deployment

How to deploy the `flappy_bull` program to devnet, and the one gotcha that will
otherwise cost you an afternoon.

Program ID: `HvwtseJuzu9XzWQ9Xh323BTVqvwpywHz16PAduoQs8vS`

## TL;DR

```bash
npm run deploy        # builds sbpf v3 + deploys to devnet (scripts/deploy-devnet.sh)
```

Do **not** deploy with a plain `anchor build` / `anchor deploy` — devnet rejects the
default build. See below.

## The gotcha: devnet requires sbpf v3

Devnet runs agave **4.1+**, which has **disabled sbpf v0 program deployments**.
`anchor build` and `cargo build-sbf` default to `--arch v0`, so deploying the
default artifact fails with:

```
Error: Error processing Instruction 1: invalid account data for instruction
```

The decisive clue is only visible in the validator log (e.g. from a local
`solana-test-validator` of the same version, or `--skip-preflight` off):

```
Detected sbpf_version required by the executable which are not enabled
```

The fix is to build the program targeting sbpf **v3**:

```bash
cargo build-sbf --arch v3 --manifest-path programs/flappy-bull/Cargo.toml
```

You can confirm the artifact's version from its ELF header — `e_flags` must be `0x3`:

```bash
llvm-readelf -h target/deploy/flappy_bull.so | grep -i flags
#   Flags: 0x3        <- sbpf v3 (good)
#   Flags: 0x0        <- sbpf v0 (will be rejected by devnet)
```

`npm run deploy` does the v3 build, verifies `e_flags == 0x3`, and only then
deploys — so you can't accidentally ship a v0 binary.

## Why this was hard to diagnose

- A **local `solana-test-validator` only enables features it knows about.** A 4.0.1
  validator still accepts v0 programs, so the deploy "works locally" and looks like a
  devnet bug. To reproduce, run a local validator matching devnet's version (4.1.x).
- The **Solana CLI version is not the cause.** Upgrading the CLI does not fix it; the
  gate is the cluster runtime plus the ELF's sbpf version.
- `anchor build -- --arch v3` does **not** work here — the `--arch` flag leaks into
  Anchor's host-side IDL build and breaks it. Build the program with `cargo build-sbf`
  directly (what `scripts/deploy-devnet.sh` does).

## Prerequisites

- Solana CLI matching devnet is recommended. Check both:
  ```bash
  solana --version                       # local CLI
  solana cluster-version --url devnet    # devnet runtime
  ```
  Install a matching version with `agave-install init <version>` (e.g.
  `agave-install init 4.1.0-beta.2`).
- A funded wallet at `~/.config/solana/id.json` (override with `SOLANA_KEYPAIR`).
  A full deploy of this program locks ~2.5 SOL in the program data account plus
  fees; keep a few SOL of headroom.

## npm scripts

| Script                  | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run build`         | `anchor build` — builds + regenerates the IDL (v0 .so, not for deploy) |
| `npm run build:program` | `cargo build-sbf --arch v3` — the deployable v3 artifact        |
| `npm run deploy`        | `scripts/deploy-devnet.sh` — v3 build, verify, deploy to devnet |
| `npm run copy-idl`      | Copy the generated IDL into the app                             |

If the program's interface changed, regenerate the IDL first
(`npm run build && npm run copy-idl`), then `npm run deploy`.

### deploy-devnet.sh env overrides

- `SOLANA_KEYPAIR` — payer/authority keypair (default `~/.config/solana/id.json`)
- `CU_PRICE` — compute unit price in micro-lamports (default `100`)

## Recovering from a failed deploy

A failed deploy leaves an intermediate **buffer account** holding ~2.8 SOL. List and
reclaim them (note the 4.1 CLI syntax change — `--buffers` is now a flag):

```bash
solana program show --buffers --url devnet                      # list orphaned buffers
solana program close --buffers --url devnet --bypass-warning    # close all + refund
```

To inspect the deployed program:

```bash
solana program show HvwtseJuzu9XzWQ9Xh323BTVqvwpywHz16PAduoQs8vS --url devnet
```
