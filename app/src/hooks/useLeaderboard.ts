import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("HvwtseJuzu9XzWQ9Xh323BTVqvwpywHz16PAduoQs8vS");
const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=0ddbecdb-2bee-4911-9767-9aaf9042c68c";
const POLL_MS = 5 * 60_000;

export type LeaderboardEntry = {
  rank: number;
  player: string;
  score: number;
};

function getLeaderboardPda(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("lb")], PROGRAM_ID)[0];
}

function fmt(pk: string): string {
  return `${pk.slice(0, 4)}...${pk.slice(-4)}`;
}

// Leaderboard layout (after 8-byte discriminator):
//   players: [Pubkey; 10]  = 320 bytes
//   scores:  [u32; 10]     = 40 bytes
//   count:   u8            = 1 byte
function decode(data: Buffer): LeaderboardEntry[] {
  const offset = 8; // skip discriminator
  const players: string[] = [];
  for (let i = 0; i < 10; i++) {
    players.push(new PublicKey(data.slice(offset + i * 32, offset + i * 32 + 32)).toBase58());
  }
  const scoresOffset = offset + 320;
  const scores: number[] = [];
  for (let i = 0; i < 10; i++) {
    scores.push(data.readUInt32LE(scoresOffset + i * 4));
  }
  const count = data[scoresOffset + 40];

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (scores[i] > 0) {
      entries.push({ rank: 0, player: fmt(players[i]), score: scores[i] });
    }
  }
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const conn = new Connection(HELIUS_RPC, "confirmed");
    const pda = getLeaderboardPda();
    let cancelled = false;

    async function fetch() {
      try {
        const info = await conn.getAccountInfo(pda);
        if (!cancelled && info?.data) {
          setEntries(decode(info.data as Buffer));
        }
      } catch {
        // ignore — show stale data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { entries, loading };
}
