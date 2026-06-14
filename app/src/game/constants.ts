export const SCALE = 256;

export const GRAVITY = 32;
export const TAP_BOOST = 768;   // upward impulse added per tap (not set)
export const MAX_UP_VEL = 900;  // max upward speed (prevents tap-spamming rocket)
export const MAX_VEL_Y = 1536;

export const CHANNEL_HALF_MIN = 70;
export const CHANNEL_HALF_MAX = 130;
export const CHANNEL_LERP_BASE = 0.04;
export const CHANNEL_LERP_FAST = 0.1;
export const PUMP_VEL_THRESHOLD = 0.8;
export const DUMP_VEL_THRESHOLD = -0.8;
export const VOLATILITY_SD_LOW = 0.05;
export const VOLATILITY_SD_HIGH = 0.35;
export const PRICE_FRAC_SCALE = 100; // sub-cent band: maps decimals 4-5 across full channel
export const ASSIST_TICKS = 60;
export const COIN_SCORE = 50;
export const PRICE_HISTORY_LEN = 30;

export const PIPE_SPACING_MIN = 240;
export const PIPE_SPACING_MAX = 360;
export const PIPE_CENTER_STEP_BASE = 90;
export const PIPE_CENTER_STEP_MAX = 160;
export const EARLY_GAP_BONUS = 30;
export const RAMP_SPACING_TIGHTEN = 60;
export const RAMP_PIPES = 30;
export const PIPE_WIDTH = 52; // px

export const BULL_RADIUS = 14;

export const CANVAS_W = 800;
export const CANVAS_H = 500;
export const BULL_X = 180;
export const SCROLL_SPEED = 2;
export const GRID_SPACING = 80;
