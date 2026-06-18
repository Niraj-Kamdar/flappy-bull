import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  registerMwa,
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-standard-mobile";
import { GameSessionProvider } from "./context/GameSessionContext";
import { BASE_RPC } from "./lib/connections";
import { AppRouter } from "./router";

// Register Mobile Wallet Adapter as a wallet-standard wallet. wallet-adapter-react
// auto-detects it; it only surfaces in the modal on Android with a compatible wallet
// (Seed Vault on Seeker). chains = devnet to match BASE_RPC.
registerMwa({
  appIdentity: {
    name: "Flappy Bull",
    uri: "https://flappy-bull.netlify.app",
    icon: "/icons/icon-192.png",
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: ["solana:devnet"],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

const wallets = [new PhantomWalletAdapter()];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={BASE_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <GameSessionProvider>
            <AppRouter />
          </GameSessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>,
);
