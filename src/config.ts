import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env before we read any process.env values
dotenv.config();

export type WhaleMode = "static" | "dynamic";

export interface TelegramConfig {
  maxQueueSize: number;
  initialRetryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface AppConfig {
  whaleMode: WhaleMode;
  staticWhalesFile: string;
  whaleRefreshIntervalMs: number;
  pollIntervalMs: number;
  minTradeNotional: number;
  healthLogIntervalMs: number;
  polymarketBaseUrl: string;
  telegram: TelegramConfig;
  stateFile: string;
}

function loadJsonConfig(): Partial<AppConfig> {
  const configPath = path.resolve(process.cwd(), "config.default.json");
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const jsonConfig = loadJsonConfig();

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const whaleModeRaw =
  (process.env.WHALE_MODE || jsonConfig.whaleMode || "dynamic")
    .toString()
    .trim()
    .toLowerCase();

export const config: AppConfig = {
  whaleMode: whaleModeRaw === "static" ? "static" : "dynamic",
  staticWhalesFile:
    process.env.STATIC_WHALES_FILE ||
    jsonConfig.staticWhalesFile ||
    "whales.static.json",
  whaleRefreshIntervalMs: envInt(
    "WHALE_REFRESH_INTERVAL_MS",
    jsonConfig.whaleRefreshIntervalMs ?? 300000
  ),
  pollIntervalMs: envInt(
    "POLL_INTERVAL_MS",
    jsonConfig.pollIntervalMs ?? 5000
  ),
  minTradeNotional: envInt(
    "MIN_TRADE_NOTIONAL",
    jsonConfig.minTradeNotional ?? 100
  ),
  healthLogIntervalMs: envInt(
    "HEALTH_LOG_INTERVAL_MS",
    jsonConfig.healthLogIntervalMs ?? 60000
  ),
  polymarketBaseUrl:
    process.env.POLYMARKET_BASE_URL ||
    jsonConfig.polymarketBaseUrl ||
    "https://gamma-api.polymarket.com",
  telegram: {
    maxQueueSize:
      envInt(
        "TELEGRAM_MAX_QUEUE_SIZE",
        jsonConfig.telegram?.maxQueueSize ?? 200
      ) || 200,
    initialRetryDelayMs:
      envInt(
        "TELEGRAM_INITIAL_RETRY_DELAY_MS",
        jsonConfig.telegram?.initialRetryDelayMs ?? 1000
      ) || 1000,
    maxRetryDelayMs:
      envInt(
        "TELEGRAM_MAX_RETRY_DELAY_MS",
        jsonConfig.telegram?.maxRetryDelayMs ?? 30000
      ) || 30000
  },
  stateFile:
    process.env.STATE_FILE ||
    (process.env.NODE_ENV === "test"
      ? path.resolve(process.cwd(), "data/state.test.json")
      : path.resolve(process.cwd(), "data/state.json"))
};

