"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env before we read any process.env values
dotenv_1.default.config();
function loadJsonConfig() {
    const configPath = path_1.default.resolve(process.cwd(), "config.default.json");
    if (!fs_1.default.existsSync(configPath)) {
        return {};
    }
    try {
        const raw = fs_1.default.readFileSync(configPath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
const jsonConfig = loadJsonConfig();
function envInt(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}
const whaleModeRaw = (process.env.WHALE_MODE || jsonConfig.whaleMode || "dynamic")
    .toString()
    .trim()
    .toLowerCase();
exports.config = {
    whaleMode: whaleModeRaw === "static" ? "static" : "dynamic",
    staticWhalesFile: process.env.STATIC_WHALES_FILE ||
        jsonConfig.staticWhalesFile ||
        "whales.static.json",
    whaleRefreshIntervalMs: envInt("WHALE_REFRESH_INTERVAL_MS", jsonConfig.whaleRefreshIntervalMs ?? 300000),
    pollIntervalMs: envInt("POLL_INTERVAL_MS", jsonConfig.pollIntervalMs ?? 5000),
    minTradeNotional: envInt("MIN_TRADE_NOTIONAL", jsonConfig.minTradeNotional ?? 100),
    healthLogIntervalMs: envInt("HEALTH_LOG_INTERVAL_MS", jsonConfig.healthLogIntervalMs ?? 60000),
    polymarketBaseUrl: process.env.POLYMARKET_BASE_URL ||
        jsonConfig.polymarketBaseUrl ||
        "https://gamma-api.polymarket.com",
    telegram: {
        maxQueueSize: envInt("TELEGRAM_MAX_QUEUE_SIZE", jsonConfig.telegram?.maxQueueSize ?? 200) || 200,
        initialRetryDelayMs: envInt("TELEGRAM_INITIAL_RETRY_DELAY_MS", jsonConfig.telegram?.initialRetryDelayMs ?? 1000) || 1000,
        maxRetryDelayMs: envInt("TELEGRAM_MAX_RETRY_DELAY_MS", jsonConfig.telegram?.maxRetryDelayMs ?? 30000) || 30000
    },
    stateFile: process.env.STATE_FILE ||
        (process.env.NODE_ENV === "test"
            ? path_1.default.resolve(process.cwd(), "data/state.test.json")
            : path_1.default.resolve(process.cwd(), "data/state.json"))
};
//# sourceMappingURL=config.js.map