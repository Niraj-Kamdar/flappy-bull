import { useEffect, useRef, useState } from "react";

const SOL_USD_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";

type OracleState = {
  price: number | null;
  lastUpdated: Date | null;
};

async function fetchHermesPrice(): Promise<{ price: number; time: Date } | null> {
  const res = await fetch(`${HERMES_URL}?ids[]=${SOL_USD_ID}`);
  if (!res.ok) return null;
  const json = await res.json();
  const p = json.parsed?.[0]?.price;
  if (!p) return null;
  const price = parseInt(p.price) * Math.pow(10, p.expo);
  if (price <= 0) return null;
  return { price, time: new Date(p.publish_time * 1000) };
}

export function usePriceOracle(): OracleState {
  const [state, setState] = useState<OracleState>({
    price: null,
    lastUpdated: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const update = async () => {
      const result = await fetchHermesPrice();
      if (result && mounted) {
        setState({ price: result.price, lastUpdated: result.time });
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return state;
}
