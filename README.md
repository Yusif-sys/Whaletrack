## Polymarket Whale Tracker

Monitor top Polymarket whale wallets in near real-time and receive Telegram alerts whenever they trade.

### Features

- **Whale modes**:
  - **Static**: track a fixed list of wallet addresses from `whales.static.json`.
  - **Dynamic**: derive whales from recent trade volume using the public Polymarket Gamma API.
- **Live trade detection**:
  - Efficient polling of `/trades` with timestamp-based incremental fetching.
  - Deduplication via a lightweight JSON state store.
- **Telegram alerts**:
  - Formatted messages with wallet, market, side, size, price, notional, timestamp, and links.
- **Configurable**:
  - Whale mode, refresh interval, polling interval, and minimum trade size filter.
- **Persistence**:
  - `data/state.json` keeps last cursor/timestamp, seen trade IDs, and the current whale list snapshot.
- **Logging**:
  - Structured logs (via `pino`) plus a health line every minute.
- **Error handling**:
  - Graceful handling of API and Telegram failures with simple backoff and queueing.
- **Tests**:
  - Unit tests for dedupe logic, whale refresh logic, and message formatting (Vitest).

---

### 1. Setup

#### 1.1. Install dependencies

```bash
cd /Users/elmarimanov/whale-track
npm install
```

#### 1.2. Telegram bot + chat ID

1. In Telegram, talk to `@BotFather`:
   - Run `/newbot` and follow the prompts.
   - Copy the `TELEGRAM_BOT_TOKEN` it gives you.
2. Add the bot to a private chat or group where you want to receive alerts.
3. Get the `TELEGRAM_CHAT_ID`:
   - Easiest: use a tool like `@userinfobot` or a simple one-off script that calls `getUpdates` for your bot.

Create a `.env` file next to `package.json` with at least:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_CHAT_ID=your-chat-id-here
```

Optional overrides:

```env
POLYMARKET_BASE_URL=https://gamma-api.polymarket.com
POLL_INTERVAL_MS=5000
WHALE_MODE=dynamic   # or "static"
WHALE_REFRESH_INTERVAL_MS=300000
MIN_TRADE_NOTIONAL=100
STATIC_WHALES_FILE=whales.static.json
STATE_FILE=./data/state.json
HEALTH_LOG_INTERVAL_MS=60000
LOG_LEVEL=info
```

#### 1.3. Static whale list (optional)

If you use `WHALE_MODE=static`, create `whales.static.json` in the project root:

```json
[
  "0x1234567890abcdef1234567890abcdef12345678",
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
]
```

---

### 2. Running locally

Build and run:

```bash
npm run build
npm start
```

Or in dev mode with auto-reload:

```bash
npm run dev
```

You should see logs like:

- Startup message and config values.
- Health line every minute with `whalesTracked` and `queueSize`.
- Per-trade logs when whale trades are detected.

Alerts will appear in your configured Telegram chat.

---

### 3. Whale logic

- **Static mode**:
  - Uses the addresses from `whales.static.json` as the whale set.
- **Dynamic mode**:
  - Periodically (default every 5 minutes) fetches recent trades from the Polymarket Gamma API.
  - Aggregates notional volume and trade count per address.
  - Marks any address above a heuristic threshold (multiples of `MIN_TRADE_NOTIONAL`) as a whale.
  - Stores the resulting whale snapshot in `data/state.json`.

Dynamic whales are refreshed on a schedule without restarting the process.

---

### 4. Trade polling & deduplication

- Polls the Gamma `/trades` endpoint every `POLL_INTERVAL_MS` milliseconds.
- Uses the last seen trade timestamp from `data/state.json` to only process newer trades.
- Maintains a sliding set of seen trade IDs so the same trade is never alerted twice, even across restarts.
- Filters out trades whose notional \(size × price\) is below `MIN_TRADE_NOTIONAL`.

---

### 5. Telegram alerts

Each alert includes:

- **Wallet**: truncated (e.g., `0x1234...5678`) plus a link to the full wallet on Polygonscan.
- **Market**: question/title (if available) and a link to the Polymarket market.
- **Trade details**:
  - Side (BUY/SELL), outcome (YES/NO), size, price, notional.
  - Timestamp (UTC ISO string).

Alerts are queued in memory and sent sequentially. If Telegram is temporarily unavailable, messages are retried with a small backoff and the queue is bounded (see `config.default.json` / env overrides).

---

### 6. Tests

Run the unit tests with:

```bash
npm test
```

Included tests:

- `tests/stateStore.test.ts`: validates dedup logic and the sliding window of seen trade IDs.
- `tests/whaleManager.test.ts`: checks dynamic whale refresh logic using a fake Polymarket client.
- `tests/telegramNotifier.test.ts`: validates Telegram message formatting (wallet truncation, amounts, and links).

---

### 7. Docker deployment

Build the Docker image:

```bash
docker build -t polymarket-whale-tracker .
```

Run with Docker:

```bash
docker run -d \
  --name polymarket-whale-tracker \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  polymarket-whale-tracker
```

Or using `docker-compose`:

```bash
docker-compose up -d --build
```

This will:

- Use the `.env` file for Telegram and config env vars.
- Mount `./data` into the container to persist state across restarts.

---

### 8. How it fits your original spec

- **Whale definition**: supports both static and dynamic modes with a refresh interval.
- **Live trade detection**: efficient polling with timestamp-based incremental fetching and deduplication.
- **Telegram alerts**: rich messages with wallet, market, side, size, price, notional, timestamp, and links.
- **Config, persistence, logging, error handling, tests, and Docker**: all included and wired up for a production-ready baseline you can deploy to a cheap VPS or any container host.

