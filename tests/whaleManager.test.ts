import { describe, it, expect } from "vitest";
import { WhaleManager } from "../src/whaleManager";
import { StateStore } from "../src/stateStore";
import { PolymarketClient } from "../src/polymarketClient";
import path from "path";
import fs from "fs";

class FakeClient extends PolymarketClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRecentTrades(_limit: number) {
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

describe("WhaleManager dynamic refresh", () => {
  it("identifies whales based on volume threshold heuristic", async () => {
    const tmp = path.resolve(__dirname, "../data/state.whales.test.json");
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

    const store = new StateStore(tmp, 100);
    const mgr = new WhaleManager(new FakeClient(), store);

    await mgr.refreshWhales();
    const whales = mgr.getWhales();

    // address 0xaaa traded 3000 size; 0xddd only 10 -> 0xaaa should be included
    const addrs = whales.map((w) => w.address);
    expect(addrs).toContain("0xaaa");
  });
});

