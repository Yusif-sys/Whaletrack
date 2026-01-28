import axios, { AxiosInstance } from "axios";
import { config } from "./config";
import { RawTrade } from "./types";
import { logger } from "./logger";

export class PolymarketClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.polymarketBaseUrl,
      timeout: 10000
    });
  }

  async getRecentTrades(limit: number = 200): Promise<RawTrade[]> {
    try {
      const res = await this.http.get("/trades", {
        params: {
          limit,
          order: "desc"
        }
      });
      if (Array.isArray(res.data)) {
        return res.data as RawTrade[];
      }
      if (Array.isArray(res.data?.data)) {
        return res.data.data as RawTrade[];
      }
      return [];
    } catch (err) {
      logger.error({ err }, "Error fetching recent trades");
      return [];
    }
  }
}

