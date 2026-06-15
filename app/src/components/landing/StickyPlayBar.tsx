import { useNavigate } from "react-router-dom";

export function StickyPlayBar() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-surface/90 backdrop-blur-md border-t border-neon-purple/30 md:hidden">
      <button
        onClick={() => navigate("/play")}
        className="w-full py-3 rounded-lg bg-neon-green text-background font-bold font-heading text-sm tracking-wide"
      >
        PLAY NOW
      </button>
    </div>
  );
}
