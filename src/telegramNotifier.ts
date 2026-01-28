import axios from "axios";
import { NormalizedTrade } from "./types";
import { logger } from "./logger";
import { config } from "./config";

export class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  private queue: NormalizedTrade[] = [];
  private sending = false;
  private stopped = false;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  static formatTradeMessage(trade: NormalizedTrade): string {
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

  enqueue(trade: NormalizedTrade): void {
    if (this.stopped) return;
    if (this.queue.length >= config.telegram.maxQueueSize) {
      logger.warn("Telegram queue full, dropping oldest message");
      this.queue.shift();
    }
    this.queue.push(trade);
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.sending || this.stopped) return;
    this.sending = true;

    while (this.queue.length && !this.stopped) {
      const trade = this.queue[0];
      const ok = await this.sendOnce(trade);
      if (ok) {
        this.queue.shift();
      } else {
        // Backoff and retry later
        const delay = config.telegram.initialRetryDelayMs;
        logger.warn({ delay }, "Telegram send failed, backing off");
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.sending = false;
  }

  private async sendOnce(trade: NormalizedTrade): Promise<boolean> {
    const text = TelegramNotifier.formatTradeMessage(trade);
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: this.chatId,
        text,
        parse_mode: "Markdown"
      });
      logger.info({ tradeId: trade.tradeId }, "Sent Telegram alert");
      return true;
    } catch (err) {
      logger.error({ err }, "Failed to send Telegram message");
      return false;
    }
  }

  async sendSimpleMessage(text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: this.chatId,
        text,
        parse_mode: "Markdown"
      });
    } catch (err) {
      logger.error({ err }, "Failed to send simple Telegram message");
    }
  }

  stop(): void {
    this.stopped = true;
  }
}

