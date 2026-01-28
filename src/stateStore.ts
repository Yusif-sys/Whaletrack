import fs from "fs";
import path from "path";
import { WhaleSnapshot } from "./types";
import { logger } from "./logger";

interface StateSchema {
  lastTradeTimestamp: number | null;
  seenTradeIds: string[];
  whales: WhaleSnapshot[];
}

const DEFAULT_STATE: StateSchema = {
  lastTradeTimestamp: null,
  seenTradeIds: [],
  whales: []
};

export class StateStore {
  private filePath: string;
  private state: StateSchema;
  private seenTradeIdsSet: Set<string>;
  private maxSeenTradeIds: number;

  constructor(filePath: string, maxSeenTradeIds: number = 10000) {
    this.filePath = path.resolve(filePath);
    this.maxSeenTradeIds = maxSeenTradeIds;
    this.state = this.loadState();
    this.seenTradeIdsSet = new Set(this.state.seenTradeIds);
  }

  private loadState(): StateSchema {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        return { ...DEFAULT_STATE };
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        seenTradeIds: parsed.seenTradeIds || [],
        whales: parsed.whales || []
      };
    } catch (err) {
      logger.error({ err }, "Failed to load state file, using defaults");
      return { ...DEFAULT_STATE };
    }
  }

  private persist(): void {
    const data: StateSchema = {
      ...this.state,
      seenTradeIds: Array.from(this.seenTradeIdsSet)
    };
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      logger.error({ err }, "Failed to persist state file");
    }
  }

  getLastTradeTimestamp(): number | null {
    return this.state.lastTradeTimestamp ?? null;
  }

  setLastTradeTimestamp(ts: number): void {
    if (!Number.isFinite(ts)) return;
    if (this.state.lastTradeTimestamp === null || ts > this.state.lastTradeTimestamp) {
      this.state.lastTradeTimestamp = ts;
      this.persist();
    }
  }

  hasSeenTrade(tradeId: string): boolean {
    return this.seenTradeIdsSet.has(tradeId);
  }

  markTradeSeen(tradeId: string): void {
    if (!tradeId) return;
    this.seenTradeIdsSet.add(tradeId);
    if (this.seenTradeIdsSet.size > this.maxSeenTradeIds) {
      const excess = this.seenTradeIdsSet.size - this.maxSeenTradeIds;
      const ids = Array.from(this.seenTradeIdsSet);
      for (let i = 0; i < excess; i += 1) {
        this.seenTradeIdsSet.delete(ids[i]);
      }
    }
    this.persist();
  }

  getWhales(): WhaleSnapshot[] {
    return [...this.state.whales];
  }

  setWhales(whales: WhaleSnapshot[]): void {
    this.state.whales = [...whales];
    this.persist();
  }
}

