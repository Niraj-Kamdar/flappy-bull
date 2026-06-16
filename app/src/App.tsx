import { useEffect } from "react";
import { WalletButton } from "./components/WalletButton";
import { PriceDisplay } from "./components/PriceDisplay";
import { GameShell } from "./components/GameShell";
import { usePriceOracle } from "./hooks/usePriceOracle";

export function App() {
  const { price, lastUpdated } = usePriceOracle();

  useEffect(() => {
    const prev = { overflow: document.body.style.overflow, overscroll: document.body.style.overscrollBehavior };
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.overscrollBehavior = prev.overscroll;
    };
  }, []);

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
