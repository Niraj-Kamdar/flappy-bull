import { WalletButton } from "./components/WalletButton";
import { PriceDisplay } from "./components/PriceDisplay";
import { GameShell } from "./components/GameShell";
import { usePriceOracle } from "./hooks/usePriceOracle";

export function App() {
  const { price, lastUpdated } = usePriceOracle();

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          flexShrink: 0,
        }}
      >
        <PriceDisplay price={price} lastUpdated={lastUpdated} />
        <WalletButton />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <GameShell price={price} />
      </div>
    </div>
  );
}
