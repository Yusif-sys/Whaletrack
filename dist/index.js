"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
const config_1 = require("./config");
const stateStore_1 = require("./stateStore");
const polymarketClient_1 = require("./polymarketClient");
const whaleManager_1 = require("./whaleManager");
const tradeStream_1 = require("./tradeStream");
const telegramNotifier_1 = require("./telegramNotifier");
dotenv_1.default.config();
async function main() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        logger_1.logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment");
        process.exit(1);
    }
    logger_1.logger.info("Starting Polymarket Whale Tracker");
    const state = new stateStore_1.StateStore(config_1.config.stateFile);
    const client = new polymarketClient_1.PolymarketClient();
    const whaleManager = new whaleManager_1.WhaleManager(client, state);
    const stream = new tradeStream_1.TradeStream(client, state);
    const notifier = new telegramNotifier_1.TelegramNotifier(botToken, chatId);
    await notifier.sendSimpleMessage("🚀 *Polymarket Whale Tracker started* – monitoring whale wallets...");
    await whaleManager.refreshWhales();
    let lastHealthLog = Date.now();
    const loop = async () => {
        try {
            const whales = whaleManager.getWhales();
            const whaleSet = whaleManager.getWhaleSet();
            const newTrades = await stream.pollNewTrades(whaleSet);
            newTrades.forEach((t) => notifier.enqueue(t));
            const now = Date.now();
            if (now - lastHealthLog >= config_1.config.healthLogIntervalMs) {
                lastHealthLog = now;
                logger_1.logger.info({
                    msg: "health",
                    whalesTracked: whales.length,
                    queueSize: notifier.queue?.length ?? undefined,
                    time: new Date().toISOString()
                });
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, "Error in main loop");
        }
    };
    const pollInterval = setInterval(loop, config_1.config.pollIntervalMs);
    const whaleRefreshInterval = setInterval(() => void whaleManager.refreshWhales(), config_1.config.whaleRefreshIntervalMs);
    const shutdown = async (signal) => {
        logger_1.logger.info({ signal }, "Shutting down whale tracker");
        clearInterval(pollInterval);
        clearInterval(whaleRefreshInterval);
        notifier.stop();
        await notifier.sendSimpleMessage("⛔ *Polymarket Whale Tracker stopped*");
        process.exit(0);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
//# sourceMappingURL=index.js.map