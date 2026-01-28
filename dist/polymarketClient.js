"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolymarketClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const logger_1 = require("./logger");
class PolymarketClient {
    constructor() {
        this.http = axios_1.default.create({
            baseURL: config_1.config.polymarketBaseUrl,
            timeout: 10000
        });
    }
    async getRecentTrades(limit = 200) {
        try {
            const res = await this.http.get("/trades", {
                params: {
                    limit,
                    order: "desc"
                }
            });
            if (Array.isArray(res.data)) {
                return res.data;
            }
            if (Array.isArray(res.data?.data)) {
                return res.data.data;
            }
            return [];
        }
        catch (err) {
            logger_1.logger.error({ err }, "Error fetching recent trades");
            return [];
        }
    }
}
exports.PolymarketClient = PolymarketClient;
//# sourceMappingURL=polymarketClient.js.map