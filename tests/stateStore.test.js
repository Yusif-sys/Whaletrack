"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stateStore_1 = require("../src/stateStore");
const tmpStatePath = path_1.default.resolve(__dirname, "../data/state.test.json");
(0, vitest_1.describe)("StateStore dedup logic", () => {
    (0, vitest_1.it)("tracks seen trade ids and enforces max size", () => {
        if (fs_1.default.existsSync(tmpStatePath)) {
            fs_1.default.unlinkSync(tmpStatePath);
        }
        const store = new stateStore_1.StateStore(tmpStatePath, 3);
        store.markTradeSeen("t1");
        store.markTradeSeen("t2");
        store.markTradeSeen("t3");
        (0, vitest_1.expect)(store.hasSeenTrade("t1")).toBe(true);
        (0, vitest_1.expect)(store.hasSeenTrade("t3")).toBe(true);
        store.markTradeSeen("t4");
        const seen = store.seenTradeIdsSet;
        (0, vitest_1.expect)(seen.size).toBe(3);
    });
});
//# sourceMappingURL=stateStore.test.js.map