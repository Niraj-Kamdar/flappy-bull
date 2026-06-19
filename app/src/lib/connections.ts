import { Connection, PublicKey } from "@solana/web3.js";

export const BASE_RPC = "https://rpc.magicblock.app/devnet";
export const BASE_WS = "wss://rpc.magicblock.app/devnet";
export const ROUTER = "https://devnet-router.magicblock.app/";
export const DEFAULT_ER = "https://devnet-as.magicblock.app/";

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
  return body.result as DelegationStatus;
}
