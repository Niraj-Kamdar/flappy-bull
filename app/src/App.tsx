import { WalletButton } from "./components/WalletButton";
import { PriceDisplay } from "./components/PriceDisplay";
import { GameShell } from "./components/GameShell";
import { usePriceOracle } from "./hooks/usePriceOracle";

export function App() {
  const { price, lastUpdated } = usePriceOracle();

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <PriceDisplay price={price} lastUpdated={lastUpdated} />
        <WalletButton />
      </div>

      <GameShell price={price} />
    </div>
  );
}
