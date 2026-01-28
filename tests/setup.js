"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Ensure Web Crypto-style API is available for Vitest/Vite in Node
const crypto_1 = require("crypto");
if (typeof globalThis.crypto === "undefined") {
    // eslint-disable-next-line no-console
    console.log("Polyfilling globalThis.crypto for Vitest");
    // @ts-expect-error: assigning webcrypto to globalThis.crypto in Node test env
    globalThis.crypto = crypto_1.webcrypto;
}
//# sourceMappingURL=setup.js.map