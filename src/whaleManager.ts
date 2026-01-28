import fs from "fs";
import path from "path";
import { config } from "./config";
import { PolymarketClient } from "./polymarketClient";
import { StateStore } from "./stateStore";
import { RawTrade, WhaleSnapshot } from "./types";
import { logger } from "./logger";

export class WhaleManager {
  private client: PolymarketClient;
  private state: StateStore;

  constructor(client: PolymarketClient, state: StateStore) {
    this.client = client;
    this.state = state;
  }

  getWhales(): WhaleSnapshot[] {
    return this.state.getWhales();
  }

  getWhaleSet(): Set<string> {
    return new Set(this.getWhales().map((w) => w.address.toLowerCase()));
  }

  private loadStaticWhales(): WhaleSnapshot[] {
    const filePath = path.resolve(process.cwd(), config.staticWhalesFile);
    if (!fs.existsSync(filePath)) {
      logger.warn(
        { filePath },
        "Static whale file not found; no static whales will be tracked"
      );
      return [];
    }
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const arr = JSON.parse(raw) as string[];
      const now = Math.floor(Date.now() / 1000);
      return arr.map((addr) => ({
        address: addr.toLowerCase(),
        totalVolume: 0,
        tradeCount: 0,
        lastSeenTs: now
      }));
    } catch (err) {
      logger.error({ err }, "Failed to load static whales file");
      return [];
    }
  }

  private aggregateDynamicWhales(trades: RawTrade[]): WhaleSnapshot[] {
    const stats: Record<
      string,
      { volume: number; count: number; lastSeen: number }
    > = {};

    for (const t of trades) {
      const maker = t.maker?.toLowerCase();
      const taker = t.taker?.toLowerCase();

      const sizeRaw = t.size ?? t.amount ?? 0;
      const size = Number(sizeRaw) || 0;

      const ts =
        t.timestamp ??
        (t.created_at ? Math.floor(Date.parse(t.created_at) / 1000) : 0);

      if (maker) {
        if (!stats[maker]) {
          stats[maker] = { volume: 0, count: 0, lastSeen: 0 };
        }
        stats[maker].volume += size;
        stats[maker].count += 1;
        stats[maker].lastSeen = Math.max(stats[maker].lastSeen, ts);
      }

      if (taker) {
        if (!stats[taker]) {
          stats[taker] = { volume: 0, count: 0, lastSeen: 0 };
        }
        stats[taker].volume += size;
        stats[taker].count += 1;
        stats[taker].lastSeen = Math.max(stats[taker].lastSeen, ts);
      }
    }

    const threshold = config.minTradeNotional * 10; // simple heuristic for "whale"
    const whales: WhaleSnapshot[] = [];
    for (const [address, s] of Object.entries(stats)) {
      if (s.volume >= threshold) {
        whales.push({
          address,
          totalVolume: s.volume,
          tradeCount: s.count,
          lastSeenTs: s.lastSeen
        });
      }
    }
    whales.sort((a, b) => b.totalVolume - a.totalVolume);
    return whales;
  }

  async refreshWhales(): Promise<void> {
    if (config.whaleMode === "static") {
      const whales = this.loadStaticWhales();
      this.state.setWhales(whales);
      logger.info({ count: whales.length }, "Loaded static whales");
      return;
    }

    logger.info("Refreshing dynamic whale list from recent trades");
    const trades = await this.client.getRecentTrades(1000);
    const whales = this.aggregateDynamicWhales(trades);
    this.state.setWhales(whales);
    logger.info({ count: whales.length }, "Dynamic whales refreshed");
  }
}

