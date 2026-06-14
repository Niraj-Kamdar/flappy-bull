import { createContext, useContext } from "react";
import { useGameSession, GameSessionHook } from "../hooks/useGameSession";

const GameSessionContext = createContext<GameSessionHook | null>(null);

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const session = useGameSession();
  return (
    <GameSessionContext.Provider value={session}>
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameSessionContext(): GameSessionHook {
  const ctx = useContext(GameSessionContext);
  if (!ctx) {
    throw new Error(
      "useGameSessionContext must be used within GameSessionProvider"
    );
  }
  return ctx;
}
