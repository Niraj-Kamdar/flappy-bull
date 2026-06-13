import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const addr = publicKey.toBase58();
    const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;
    return (
      <button onClick={() => disconnect()} style={btnStyle}>
        {short} ✕
      </button>
    );
  }

  return (
    <button onClick={() => setVisible(true)} style={btnStyle}>
      Connect Wallet
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#1a1a2e",
  border: "1px solid #444",
  color: "#fff",
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "monospace",
  fontSize: "14px",
};
