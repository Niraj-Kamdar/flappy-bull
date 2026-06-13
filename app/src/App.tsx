import { WalletButton } from "./components/WalletButton";
import { PriceDisplay } from "./components/PriceDisplay";
import { GameCanvas } from "./components/GameCanvas";
import { DelegateTest } from "./components/DelegateTest";
import { usePriceOracle } from "./hooks/usePriceOracle";

export function App() {
  const { price } = usePriceOracle();

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
        <PriceDisplay />
        <WalletButton />
      </div>

      <GameCanvas price={price} />
      <DelegateTest />
    </div>
  );
}
