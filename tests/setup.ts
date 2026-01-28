// Ensure Web Crypto-style API is available for Vitest/Vite in Node
import { webcrypto as nodeWebcrypto } from "crypto";

if (typeof globalThis.crypto === "undefined") {
  // eslint-disable-next-line no-console
  console.log("Polyfilling globalThis.crypto for Vitest");
  // @ts-expect-error: assigning webcrypto to globalThis.crypto in Node test env
  globalThis.crypto = nodeWebcrypto;
}

