import { useEffect, useRef, useState, useCallback } from "react";
import { Connection, PublicKey, AccountInfo } from "@solana/web3.js";
import { Buffer } from "buffer";

// Pyth Lazer SOL/USD feed on MagicBlock devnet
// PDA: ["price_feed", "pyth-lazer", "6"]
const PROGRAM_ID = new PublicKey(
  "PriCems5tHihc6UDXDjzjeawomAwBduWMGAi8ZUjppd"
);
const FEED_ID = "6"; // SOL/USD, exponent = -8

/** Shared Pyth Lazer SOL/USD feed PDA — used by both oracle hook and chain txs. */
export function derivePythFeedAddress(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("price_feed"), Buffer.from("pyth-lazer"), Buffer.from(FEED_ID)],
    PROGRAM_ID
  )[0];
}

// PriceUpdateV2: raw i64 at byte offset 73 (little-endian)
const PRICE_OFFSET = 73;

const MAGICBLOCK_RPC = "https://devnet.magicblock.app";
const MAGICBLOCK_WS = "wss://devnet.magicblock.app";

/** Parse the raw Pyth Lazer i64 price from account data. */
function parseRawPrice(data: Buffer): bigint | null {
  if (data.byteLength < PRICE_OFFSET + 8) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return view.getBigInt64(PRICE_OFFSET, true);
}

/** Convert Pyth Lazer raw price to a dollar-price JS number.
 *  SOL/USD exponent = -8, so divide by 10^8. */
function rawToDollars(raw: bigint): number {
  // raw / 1e8 as a float
  return Number(raw) / 100_000_000;
}

export type OracleState = {
  price: number | null; // dollar price (e.g. 150.00)
  rawPrice: bigint | null;
  lastUpdated: Date | null;
  error: string | null;
};

export function usePriceOracle(): OracleState {
  const [state, setState] = useState<OracleState>({
    price: null,
    rawPrice: null,
    lastUpdated: null,
    error: null,
  });

  const connectionRef = useRef<Connection | null>(null);
  const subIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const deriveFeedAddress = useCallback((): PublicKey => {
    return derivePythFeedAddress();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const conn = new Connection(MAGICBLOCK_RPC, {
      wsEndpoint: MAGICBLOCK_WS,
      commitment: "confirmed",
    });
    connectionRef.current = conn;

    let cancelled = false;

    async function subscribe() {
      try {
        const feedAddress = deriveFeedAddress();

        // Get initial data
        const accountInfo = await conn.getAccountInfo(feedAddress);
        if (cancelled || !mountedRef.current) return;

        if (accountInfo) {
          const raw = parseRawPrice(Buffer.from(accountInfo.data));
          if (raw !== null) {
            setState({
              price: rawToDollars(raw),
              rawPrice: raw,
              lastUpdated: new Date(),
              error: null,
            });
          }
        }

        // Subscribe to changes
        subIdRef.current = conn.onAccountChange(
          feedAddress,
          (accountInfo: AccountInfo<Buffer>) => {
            if (!mountedRef.current) return;
            const raw = parseRawPrice(Buffer.from(accountInfo.data));
            if (raw !== null) {
              setState({
                price: rawToDollars(raw),
                rawPrice: raw,
                lastUpdated: new Date(),
                error: null,
              });
            }
          },
          "confirmed"
        );
      } catch (err: any) {
        if (!cancelled && mountedRef.current) {
          setState((s) => ({ ...s, error: err.message }));
        }
      }
    }

    subscribe();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (connectionRef.current && subIdRef.current !== null) {
        connectionRef.current
          .removeAccountChangeListener(subIdRef.current)
          .catch(() => {});
      }
    };
  }, [deriveFeedAddress]);

  return state;
}
