import { useState, useRef, useEffect } from "react";
import {
  CANVAS_H,
  PRICE_HISTORY_LEN,
  CHANNEL_HALF_MIN,
  CHANNEL_HALF_MAX,
  VOLATILITY_SD_LOW,
  VOLATILITY_SD_HIGH,
  PRICE_FRAC_SCALE,
  PIPE_SPACING_MIN,
  PIPE_SPACING_MAX,
} from "../game/constants";

export type VolatilityState = "NORMAL" | "SQUEEZE" | "BREAKOUT";

export type PriceChannelState = {
  channelHalf: number;
  pipeSpacing: number;
  volatilityState: VolatilityState;
  priceVelocity: number;
};

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

const DEFAULT_STATE: PriceChannelState = {
  channelHalf: 75,
  pipeSpacing: PIPE_SPACING_MAX,
  volatilityState: "NORMAL",
  priceVelocity: 0,
};

export function usePriceChannel(price: number | null): PriceChannelState {
  const [state, setState] = useState<PriceChannelState>(DEFAULT_STATE);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (price === null) return;

    const history = historyRef.current;
    history.push(price);
    if (history.length > PRICE_HISTORY_LEN) history.shift();

    const priceVelocity = history.length >= 2
      ? history[history.length - 1] - history[history.length - 2]
      : 0;

    const sd = stddev(history);
    const t = Math.max(0, Math.min(1, (sd - VOLATILITY_SD_LOW) / (VOLATILITY_SD_HIGH - VOLATILITY_SD_LOW)));
    const channelHalf = Math.round(CHANNEL_HALF_MIN + t * (CHANNEL_HALF_MAX - CHANNEL_HALF_MIN));

    const volatilityState: VolatilityState =
      sd <= VOLATILITY_SD_LOW ? "SQUEEZE" : sd >= VOLATILITY_SD_HIGH ? "BREAKOUT" : "NORMAL";

    const pipeSpacing = Math.round(PIPE_SPACING_MAX - t * (PIPE_SPACING_MAX - PIPE_SPACING_MIN));

    setState({ channelHalf, pipeSpacing, volatilityState, priceVelocity });
  }, [price]);

  return state;
}
