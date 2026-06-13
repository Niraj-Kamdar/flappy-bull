import { useRef } from "react";
import { WalletButton } from "./components/WalletButton";
import { PriceDisplay } from "./components/PriceDisplay";
import { PixiCanvas, PixiAppRef } from "./components/PixiCanvas";
import { DelegateTest } from "./components/DelegateTest";

export function App() {
  const appRef = useRef<PixiAppRef>(null);

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

      <PixiCanvas appRef={appRef} />
      <DelegateTest />
    </div>
  );
}
