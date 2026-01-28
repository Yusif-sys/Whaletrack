"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const telegramNotifier_1 = require("../src/telegramNotifier");
(0, vitest_1.describe)("TelegramNotifier message formatting", () => {
    (0, vitest_1.it)("includes truncated and full wallet plus key trade fields", () => {
        const trade = {
            tradeId: "t1",
            wallet: "0x1234567890abcdef1234567890abcdef12345678",
            side: "BUY",
            outcome: "YES",
            size: 100,
            price: 0.55,
            notional: 55,
            timestamp: 1700000000,
            marketId: "us-election-2028",
            marketQuestion: "Will the Democrat candidate win the 2028 US Presidential election?"
        };
        const msg = telegramNotifier_1.TelegramNotifier.formatTradeMessage(trade);
        (0, vitest_1.expect)(msg).toContain("0x1234");
        (0, vitest_1.expect)(msg).toContain("...5678");
        (0, vitest_1.expect)(msg).toContain("BUY");
        (0, vitest_1.expect)(msg).toContain("YES");
        (0, vitest_1.expect)(msg).toContain("55.00");
        (0, vitest_1.expect)(msg).toContain("View market");
    });
});
//# sourceMappingURL=telegramNotifier.test.js.map