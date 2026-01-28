"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const whaleManager_1 = require("../src/whaleManager");
const stateStore_1 = require("../src/stateStore");
const polymarketClient_1 = require("../src/polymarketClient");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class FakeClient extends polymarketClient_1.PolymarketClient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getRecentTrades(_limit) {
        return [
            {
                id: "1",
                maker: "0xAAA",
                taker: "0xBBB",
                size: 1000,
                timestamp: 1000
            },
            {
                id: "2",
                maker: "0xAAA",
                taker: "0xCCC",
                size: 2000,
                timestamp: 2000
            },
            {
                id: "3",
                maker: "0xDDD",
                taker: "0xEEE",
                size: 10,
                timestamp: 3000
            }
        ];
    }
}
(0, vitest_1.describe)("WhaleManager dynamic refresh", () => {
    (0, vitest_1.it)("identifies whales based on volume threshold heuristic", async () => {
        const tmp = path_1.default.resolve(__dirname, "../data/state.whales.test.json");
        if (fs_1.default.existsSync(tmp))
            fs_1.default.unlinkSync(tmp);
        const store = new stateStore_1.StateStore(tmp, 100);
        const mgr = new whaleManager_1.WhaleManager(new FakeClient(), store);
        await mgr.refreshWhales();
        const whales = mgr.getWhales();
        // address 0xaaa traded 3000 size; 0xddd only 10 -> 0xaaa should be included
        const addrs = whales.map((w) => w.address);
        (0, vitest_1.expect)(addrs).toContain("0xaaa");
    });
});
//# sourceMappingURL=whaleManager.test.js.map