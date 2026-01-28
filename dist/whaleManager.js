"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhaleManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const logger_1 = require("./logger");
class WhaleManager {
    constructor(client, state) {
        this.client = client;
        this.state = state;
    }
    getWhales() {
        return this.state.getWhales();
    }
    getWhaleSet() {
        return new Set(this.getWhales().map((w) => w.address.toLowerCase()));
    }
    loadStaticWhales() {
        const filePath = path_1.default.resolve(process.cwd(), config_1.config.staticWhalesFile);
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.warn({ filePath }, "Static whale file not found; no static whales will be tracked");
            return [];
        }
        try {
            const raw = fs_1.default.readFileSync(filePath, "utf8");
            const arr = JSON.parse(raw);
            const now = Math.floor(Date.now() / 1000);
            return arr.map((addr) => ({
                address: addr.toLowerCase(),
                totalVolume: 0,
                tradeCount: 0,
                lastSeenTs: now
            }));
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to load static whales file");
            return [];
        }
    }
    aggregateDynamicWhales(trades) {
        const stats = {};
        for (const t of trades) {
            const maker = t.maker?.toLowerCase();
            const taker = t.taker?.toLowerCase();
            const sizeRaw = t.size ?? t.amount ?? 0;
            const size = Number(sizeRaw) || 0;
            const ts = t.timestamp ??
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
        const threshold = config_1.config.minTradeNotional * 10; // simple heuristic for "whale"
        const whales = [];
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
    async refreshWhales() {
        if (config_1.config.whaleMode === "static") {
            const whales = this.loadStaticWhales();
            this.state.setWhales(whales);
            logger_1.logger.info({ count: whales.length }, "Loaded static whales");
            return;
        }
        logger_1.logger.info("Refreshing dynamic whale list from recent trades");
        const trades = await this.client.getRecentTrades(1000);
        const whales = this.aggregateDynamicWhales(trades);
        this.state.setWhales(whales);
        logger_1.logger.info({ count: whales.length }, "Dynamic whales refreshed");
    }
}
exports.WhaleManager = WhaleManager;
//# sourceMappingURL=whaleManager.js.map