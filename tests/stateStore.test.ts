import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { StateStore } from "../src/stateStore";

const tmpStatePath = path.resolve(__dirname, "../data/state.test.json");

describe("StateStore dedup logic", () => {
  it("tracks seen trade ids and enforces max size", () => {
    if (fs.existsSync(tmpStatePath)) {
      fs.unlinkSync(tmpStatePath);
    }
    const store = new StateStore(tmpStatePath, 3);

    store.markTradeSeen("t1");
    store.markTradeSeen("t2");
    store.markTradeSeen("t3");
    expect(store.hasSeenTrade("t1")).toBe(true);
    expect(store.hasSeenTrade("t3")).toBe(true);

    store.markTradeSeen("t4");

    const seen = (store as any).seenTradeIdsSet as Set<string>;
    expect(seen.size).toBe(3);
  });
});

