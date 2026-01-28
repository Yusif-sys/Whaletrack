"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramNotifier = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
const config_1 = require("./config");
class TelegramNotifier {
    constructor(botToken, chatId) {
        this.queue = [];
        this.sending = false;
        this.stopped = false;
        this.botToken = botToken;
        this.chatId = chatId;
    }
    static formatTradeMessage(trade) {
        const shortWallet = `${trade.wallet.slice(0, 6)}...${trade.wallet.slice(-4)}`;
        const emoji = trade.outcome === "YES" ? "🟢" : trade.outcome === "NO" ? "🔴" : "⚪️";
        const sideEmoji = trade.side === "BUY" ? "📈" : "📉";
        const ts = new Date(trade.timestamp * 1000).toISOString();
        const marketUrl = trade.marketId
            ? `https://polymarket.com/event/${encodeURIComponent(trade.marketId)}`
            : "https://polymarket.com/markets";
        const walletUrl = `https://polygonscan.com/address/${trade.wallet}`;
        return [
            `${emoji} *Whale trade detected*`,
            ``,
            `*Wallet*: \`${shortWallet}\``,
            `Full: [link](${walletUrl})`,
            `*Side*: ${sideEmoji} *${trade.side}* on *${trade.outcome}*`,
            `*Size*: ${trade.size.toFixed(2)} shares`,
            `*Price*: $${trade.price.toFixed(4)}`,
            `*Notional*: $${trade.notional.toFixed(2)}`,
            ``,
            `*Market*: ${trade.marketQuestion}`,
            `[View market](${marketUrl})`,
            ``,
            `*Time*: ${ts}`
        ].join("\n");
    }
    enqueue(trade) {
        if (this.stopped)
            return;
        if (this.queue.length >= config_1.config.telegram.maxQueueSize) {
            logger_1.logger.warn("Telegram queue full, dropping oldest message");
            this.queue.shift();
        }
        this.queue.push(trade);
        void this.processQueue();
    }
    async processQueue() {
        if (this.sending || this.stopped)
            return;
        this.sending = true;
        while (this.queue.length && !this.stopped) {
            const trade = this.queue[0];
            const ok = await this.sendOnce(trade);
            if (ok) {
                this.queue.shift();
            }
            else {
                // Backoff and retry later
                const delay = config_1.config.telegram.initialRetryDelayMs;
                logger_1.logger.warn({ delay }, "Telegram send failed, backing off");
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        this.sending = false;
    }
    async sendOnce(trade) {
        const text = TelegramNotifier.formatTradeMessage(trade);
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        try {
            await axios_1.default.post(url, {
                chat_id: this.chatId,
                text,
                parse_mode: "Markdown"
            });
            logger_1.logger.info({ tradeId: trade.tradeId }, "Sent Telegram alert");
            return true;
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to send Telegram message");
            return false;
        }
    }
    async sendSimpleMessage(text) {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        try {
            await axios_1.default.post(url, {
                chat_id: this.chatId,
                text,
                parse_mode: "Markdown"
            });
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to send simple Telegram message");
        }
    }
    stop() {
        this.stopped = true;
    }
}
exports.TelegramNotifier = TelegramNotifier;
//# sourceMappingURL=telegramNotifier.js.map