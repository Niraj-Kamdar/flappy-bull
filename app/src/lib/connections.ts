import { Connection, PublicKey } from "@solana/web3.js";

// Base-layer (devnet) reads/writes. The magicblock devnet RPC serves getSlot
// but times out on getAccountInfo, which hangs every account fetch — use the
// Helius devnet RPC (already used by the leaderboard) for reliable reads.
export const BASE_RPC =
  "https://devnet.helius-rpc.com/?api-key=0ddbecdb-2bee-4911-9767-9aaf9042c68c";
export const BASE_WS =
  "wss://devnet.helius-rpc.com/?api-key=0ddbecdb-2bee-4911-9767-9aaf9042c68c";
export const ROUTER = "https://devnet-router.magicblock.app/";
export const DEFAULT_ER = "https://devnet-as.magicblock.app/";

// MagicBlock delegation program. A base-layer account owned by this program is
// delegated to an ephemeral rollup.
export const DELEGATION_PROGRAM = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);

// Cloudflare Worker relayer. Pays + broadcasts the base-layer txs
// (start_run/delegate, update_leaderboard) so the user needs zero devnet SOL.
// Set this to the deployed `workers.dev` URL after `wrangler deploy`.
export const RELAYER = "https://api.flappybull.metasquare.tech";

export const baseConnection = new Connection(BASE_RPC, {
  commitment: "confirmed",
  wsEndpoint: BASE_WS,
});

export function makeErConnection(fqdn: string): Connection {
  const endpoint = fqdn.startsWith("http") ? fqdn : `https://${fqdn}`;
  return new Connection(endpoint, { commitment: "confirmed" });
}

export type DelegationStatus = {
  isDelegated: boolean;
  fqdn?: string;
  delegationRecord?: {
    authority: string;
    owner: string;
    delegationSlot: number;
    lamports: number;
  };
};

export async function getDelegationStatus(
  account: PublicKey
): Promise<DelegationStatus> {
  const res = await fetch(ROUTER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getDelegationStatus",
      params: [account.toBase58()],
    }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  const result = body.result as DelegationStatus;
  if (result.isDelegated && result.fqdn) return result;

  // Router fallback: it sometimes fails to acknowledge a genuinely-delegated
  // account (returns isDelegated:false with no fqdn) when the holding validator
  // isn't in its active routing table — e.g. after a program upgrade. The
  // authoritative signal is base-layer ownership: if the delegation program owns
  // the account, it IS delegated. Use DEFAULT_ER since the router gave no fqdn.
  // This keeps the normal flow working and lets hydrate auto-finish a stuck PDA.
  try {
    const info = await baseConnection.getAccountInfo(account);
    if (info && info.owner.equals(DELEGATION_PROGRAM)) {
      return { isDelegated: true, fqdn: DEFAULT_ER };
    }
  } catch {
    // fall through to the router's (negative) result
  }
  return result;
}
