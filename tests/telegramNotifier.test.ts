import { describe, it, expect } from "vitest";
import { TelegramNotifier } from "../src/telegramNotifier";
import { NormalizedTrade } from "../src/types";

describe("TelegramNotifier message formatting", () => {
  it("includes truncated and full wallet plus key trade fields", () => {
    const trade: NormalizedTrade = {
      tradeId: "t1",
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      side: "BUY",
      outcome: "YES",
      size: 100,
      price: 0.55,
      notional: 55,
      timestamp: 1_700_000_000,
      marketId: "us-election-2028",
      marketQuestion: "Will the Democrat candidate win the 2028 US Presidential election?"
    };

    const msg = TelegramNotifier.formatTradeMessage(trade);
    expect(msg).toContain("0x1234");
    expect(msg).toContain("...5678");
    expect(msg).toContain("BUY");
    expect(msg).toContain("YES");
    expect(msg).toContain("55.00");
    expect(msg).toContain("View market");
  });
});

