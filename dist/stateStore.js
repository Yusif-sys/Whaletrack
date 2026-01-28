"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const DEFAULT_STATE = {
    lastTradeTimestamp: null,
    seenTradeIds: [],
    whales: []
};
class StateStore {
    constructor(filePath, maxSeenTradeIds = 10000) {
        this.filePath = path_1.default.resolve(filePath);
        this.maxSeenTradeIds = maxSeenTradeIds;
        this.state = this.loadState();
        this.seenTradeIdsSet = new Set(this.state.seenTradeIds);
    }
    loadState() {
        try {
            if (!fs_1.default.existsSync(this.filePath)) {
                fs_1.default.mkdirSync(path_1.default.dirname(this.filePath), { recursive: true });
                return { ...DEFAULT_STATE };
            }
            const raw = fs_1.default.readFileSync(this.filePath, "utf8");
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_STATE,
                ...parsed,
                seenTradeIds: parsed.seenTradeIds || [],
                whales: parsed.whales || []
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to load state file, using defaults");
            return { ...DEFAULT_STATE };
        }
    }
    persist() {
        const data = {
            ...this.state,
            seenTradeIds: Array.from(this.seenTradeIdsSet)
        };
        try {
            fs_1.default.mkdirSync(path_1.default.dirname(this.filePath), { recursive: true });
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to persist state file");
        }
    }
    getLastTradeTimestamp() {
        return this.state.lastTradeTimestamp ?? null;
    }
    setLastTradeTimestamp(ts) {
        if (!Number.isFinite(ts))
            return;
        if (this.state.lastTradeTimestamp === null || ts > this.state.lastTradeTimestamp) {
            this.state.lastTradeTimestamp = ts;
            this.persist();
        }
    }
    hasSeenTrade(tradeId) {
        return this.seenTradeIdsSet.has(tradeId);
    }
    markTradeSeen(tradeId) {
        if (!tradeId)
            return;
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
    getWhales() {
        return [...this.state.whales];
    }
    setWhales(whales) {
        this.state.whales = [...whales];
        this.persist();
    }
}
exports.StateStore = StateStore;
//# sourceMappingURL=stateStore.js.map