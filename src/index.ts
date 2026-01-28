import dotenv from "dotenv";
import { logger } from "./logger";
import { config } from "./config";
import { StateStore } from "./stateStore";
import { PolymarketClient } from "./polymarketClient";
import { WhaleManager } from "./whaleManager";
import { TradeStream } from "./tradeStream";
import { TelegramNotifier } from "./telegramNotifier";

dotenv.config();

async function main(): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    logger.error(
      "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in environment"
    );
    process.exit(1);
  }

  logger.info("Starting Polymarket Whale Tracker");

  const state = new StateStore(config.stateFile);
  const client = new PolymarketClient();
  const whaleManager = new WhaleManager(client, state);
  const stream = new TradeStream(client, state);
  const notifier = new TelegramNotifier(botToken, chatId);

  await notifier.sendSimpleMessage(
    "🚀 *Polymarket Whale Tracker started* – monitoring whale wallets..."
  );

  await whaleManager.refreshWhales();

  let lastHealthLog = Date.now();

  const loop = async () => {
    try {
      const whales = whaleManager.getWhales();
      const whaleSet = whaleManager.getWhaleSet();

      const newTrades = await stream.pollNewTrades(whaleSet);
      newTrades.forEach((t) => notifier.enqueue(t));

      const now = Date.now();
      if (now - lastHealthLog >= config.healthLogIntervalMs) {
        lastHealthLog = now;
        logger.info({
          msg: "health",
          whalesTracked: whales.length,
          queueSize: (notifier as any).queue?.length ?? undefined,
          time: new Date().toISOString()
        });
      }
    } catch (err) {
      logger.error({ err }, "Error in main loop");
    }
  };

  const pollInterval = setInterval(loop, config.pollIntervalMs);

  const whaleRefreshInterval = setInterval(
    () => void whaleManager.refreshWhales(),
    config.whaleRefreshIntervalMs
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down whale tracker");
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

