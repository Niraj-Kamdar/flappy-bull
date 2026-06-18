// Bootstrap the deployed flappy_bull program on devnet:
//   - init_leaderboard  (PDA [b"lb"])
//   - init_room(0, ...)  (PDA [b"season", 0]) — desktop config
//   - init_room(1, ...)  (PDA [b"season", 1]) — mobile config
//
// Gameplay (start_run, finish_run, update_leaderboard) reads the per-room
// SeasonParams PDA, so every room a player can join must be initialized here.
//
// The program ID is read from the program keypair so it always matches the
// currently deployed program, regardless of any stale `address` in the IDL.
//
// Usage: node scripts/init-program.mjs

import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { homedir } from "os";

const RPC_URL = "https://api.devnet.solana.com";

// Program ID = pubkey of the program keypair (single source of truth).
const programKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync("target/deploy/flappy_bull-keypair.json", "utf-8")))
);
const PROGRAM_ID = programKeypair.publicKey;

const DESKTOP_CONFIG = {
  gravity: 32,
  tapBoost: 768,
  maxUpVel: 900,
  maxVelY: 1536,
  scale: 256,
  canvasHPx: 500,
  canvasWPx: 800,
  bullRadiusPx: 14,
  channelHalfMin: 70,
  lerpNumBase: 4,
  lerpDen: 100,
  lerpNumFast: 10,
  bullXPx: 180,
  pipeWidthPx: 52,
  pipeScroll: 512,
  pipeSpacingPx: 360,
  priceVelFastThresh: new BN(8000),
  priceFracScale: new BN(100),
  season: 0,
  pad: [0, 0, 0],
};

const MOBILE_CONFIG = {
  gravity: 30,
  tapBoost: 900,
  maxUpVel: 900,
  maxVelY: 1536,
  scale: 256,
  canvasHPx: 640,
  canvasWPx: 360,
  bullRadiusPx: 14,
  channelHalfMin: 90,
  lerpNumBase: 4,
  lerpDen: 100,
  lerpNumFast: 10,
  bullXPx: 120,
  pipeWidthPx: 52,
  pipeScroll: 384,
  pipeSpacingPx: 280,
  priceVelFastThresh: new BN(8000),
  priceFracScale: new BN(100),
  season: 1,
  pad: [0, 0, 0],
};

async function main() {
  const wallet = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf-8")))
  );

  const idl = JSON.parse(
    readFileSync(new URL("../app/src/idl/flappy_bull.json", import.meta.url).pathname, "utf-8")
  );
  idl.address = PROGRAM_ID.toBase58();

  const conn = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    conn,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx) => { tx.sign(wallet); return tx; },
      signAllTransactions: async (txs) => { txs.forEach((tx) => tx.sign(wallet)); return txs; },
    },
    { commitment: "confirmed" }
  );
  const program = new Program(idl, provider);

  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Wallet: ", wallet.publicKey.toBase58());

  const [lbPda] = PublicKey.findProgramAddressSync([Buffer.from("lb")], PROGRAM_ID);

  // Leaderboard
  if (await conn.getAccountInfo(lbPda)) {
    console.log(`\nLeaderboard ${lbPda.toBase58()} already initialized`);
  } else {
    console.log(`\nInitializing Leaderboard ${lbPda.toBase58()}...`);
    const sig = await program.methods
      .initLeaderboard()
      .accounts({ authority: wallet.publicKey, leaderboard: lbPda, systemProgram: SystemProgram.programId })
      .rpc({ commitment: "confirmed" });
    console.log("  sig:", sig);
  }

  // Rooms
  await initRoom(program, wallet, 0, DESKTOP_CONFIG);
  await initRoom(program, wallet, 1, MOBILE_CONFIG);

  console.log("\nDone");
}

async function initRoom(program, wallet, roomId, config) {
  const [roomPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("season"), Buffer.from([roomId])],
    program.programId
  );
  console.log(`\nRoom ${roomId} PDA: ${roomPda.toBase58()}`);
  const sig = await program.methods
    .initRoom(roomId, config)
    .accounts({ authority: wallet.publicKey, seasonParams: roomPda, systemProgram: SystemProgram.programId })
    .rpc({ commitment: "confirmed" });
  console.log(`  Room ${roomId} initialized. sig: ${sig}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
