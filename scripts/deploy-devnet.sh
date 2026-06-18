#!/usr/bin/env bash
#
# Deploy flappy_bull to devnet.
#
# Devnet (agave 4.1+) rejects sbpf v0 programs. `anchor build` / `cargo build-sbf`
# default to v0, which fails with:
#   Error processing Instruction 1: invalid account data for instruction
#   (validator log: "Detected sbpf_version required by the executable which are not enabled")
#
# This script forces an sbpf v3 build and verifies it before deploying.
# See DEPLOYMENT.md for the full story.

set -euo pipefail

cd "$(dirname "$0")/.."

PROGRAM_SO="target/deploy/flappy_bull.so"
PROGRAM_KEYPAIR="target/deploy/flappy_bull-keypair.json"
KEYPAIR="${SOLANA_KEYPAIR:-$HOME/.config/solana/id.json}"
CU_PRICE="${CU_PRICE:-100}"

echo "==> Building program (sbpf v3)"
cargo build-sbf --arch v3 --manifest-path programs/flappy-bull/Cargo.toml

# Verify the ELF is sbpf v3 (e_flags == 0x3) before spending lamports on a deploy.
READELF="$(command -v llvm-readelf || command -v readelf || echo /opt/homebrew/opt/llvm@14/bin/llvm-readelf)"
if [ -x "$READELF" ] || command -v "$READELF" >/dev/null 2>&1; then
  FLAGS="$("$READELF" -h "$PROGRAM_SO" | awk '/Flags:/{print $2}')"
  if [ "$FLAGS" != "0x3" ]; then
    echo "ERROR: $PROGRAM_SO is not sbpf v3 (e_flags=$FLAGS). Aborting deploy." >&2
    exit 1
  fi
  echo "==> Verified sbpf v3 (e_flags=0x3)"
else
  echo "WARN: no readelf found; skipping sbpf-version check" >&2
fi

echo "==> Deploying to devnet"
solana program deploy \
  --url devnet \
  --keypair "$KEYPAIR" \
  --program-id "$PROGRAM_KEYPAIR" \
  --with-compute-unit-price "$CU_PRICE" \
  "$PROGRAM_SO"

echo "==> Done"
