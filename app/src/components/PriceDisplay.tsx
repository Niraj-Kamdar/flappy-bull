import { usePriceOracle } from "../hooks/usePriceOracle";

export function PriceDisplay() {
  const { price, lastUpdated } = usePriceOracle();

  return (
    <div style={{ fontFamily: "monospace", fontSize: "24px" }}>
      <span style={{ color: "#888", fontSize: "12px" }}>SOL/USD </span>
      <span style={{ color: price ? "#00ff88" : "#555" }}>
        {price ? `$${price.toFixed(5)}` : "loading…"}
      </span>
      {lastUpdated && (
        <span style={{ color: "#555", fontSize: "11px", marginLeft: "8px" }}>
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
