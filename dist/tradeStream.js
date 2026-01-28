"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeStream = void 0;
const config_1 = require("./config");
const logger_1 = require("./logger");
function normalizeTrade(raw, wallet) {
    const outcomeRaw = (raw.outcome || raw.side || "").toUpperCase();
    let outcome = "UNKNOWN";
    if (outcomeRaw.includes("YES"))
        outcome = "YES";
    else if (outcomeRaw.includes("NO"))
        outcome = "NO";
    const sizeNum = Number(raw.size ?? raw.amount ?? 0) || 0;
    const priceNum = Number(raw.price ?? 0.5) || 0.5;
    const notional = sizeNum * priceNum;
    if (!raw.id || !wallet || notional < config_1.config.minTradeNotional) {
        return null;
    }
    const ts = raw.timestamp ??
        (raw.created_at ? Math.floor(Date.parse(raw.created_at) / 1000) : 0);
    return {
        tradeId: raw.id,
        wallet,
        side: wallet === raw.maker?.toLowerCase() ? "SELL" : "BUY",
        outcome,
        size: sizeNum,
        price: priceNum,
        notional,
        timestamp: ts,
        marketId: raw.market || "",
        marketQuestion: raw.question || "Unknown market"
    };
}
class TradeStream {
    constructor(client, state) {
        this.client = client;
        this.state = state;
    }
    async pollNewTrades(whaleSet) {
        const trades = await this.client.getRecentTrades(200);
        if (!trades.length)
            return [];
        const lastTs = this.state.getLastTradeTimestamp() ?? 0;
        const fresh = [];
        let maxTs = lastTs;
        for (const t of trades) {
            const ts = t.timestamp ??
                (t.created_at ? Math.floor(Date.parse(t.created_at) / 1000) : 0);
            if (ts <= lastTs) {
                continue;
            }
            maxTs = Math.max(maxTs, ts);
            fresh.push(t);
        }
        const results = [];
        for (const t of fresh) {
            const maker = t.maker?.toLowerCase();
            const taker = t.taker?.toLowerCase();
            const makerWhale = maker ? whaleSet.has(maker) : false;
            const takerWhale = taker ? whaleSet.has(taker) : false;
            if (!makerWhale && !takerWhale) {
                continue;
            }
            const wallet = makerWhale ? maker : taker;
            if (this.state.hasSeenTrade(t.id)) {
                continue;
            }
            const normalized = normalizeTrade(t, wallet);
            if (!normalized)
                continue;
            results.push(normalized);
            this.state.markTradeSeen(t.id);
        }
        if (maxTs > lastTs) {
            this.state.setLastTradeTimestamp(maxTs);
        }
        if (results.length) {
            logger_1.logger.info({ count: results.length }, "Emitting new normalized whale trades");
        }
        return results;
    }
}
exports.TradeStream = TradeStream;
//# sourceMappingURL=tradeStream.js.map