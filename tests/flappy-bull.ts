import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FlappyBull } from "../target/types/flappy_bull";
import { PublicKey } from "@solana/web3.js";
import assert from "assert";

describe("flappy-bull", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FlappyBull as Program<FlappyBull>;
  const player = provider.wallet.publicKey;

  let sessionPda: PublicKey;

  before(async () => {
    [sessionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("session"), player.toBuffer()],
      program.programId
    );
  });

  it("initializes a game session", async () => {
    await program.methods
      .initialize()
      .accounts({ player, gameSession: sessionPda })
      .rpc();

    const session = await program.account.gameSession.fetch(sessionPda);
    assert.ok(session.player.equals(player));
    assert.ok(session.alive);
    assert.equal(session.score.toNumber(), 0);
  });
});
