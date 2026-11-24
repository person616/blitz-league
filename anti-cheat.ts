/**
 * Blitz League save protection.
 *
 * The game is deliberately client-side, so this module is a hardening layer,
 * not a substitute for a server-authoritative economy. It stops the common
 * cheats against browser-storage games:
 *
 *   - editing coins/XP in localStorage,
 *   - replaying an old save to reroll crates,
 *   - replaying the same reward transaction,
 *   - negative, fractional, NaN, infinite or overflowing balances,
 *   - grants from unknown reasons or above their shipped maximum,
 *   - invalid or partially written saves (a mirrored copy is kept),
 *   - unsigned developer saves leaking into the public build.
 *
 * Saves are keyed with HMAC-SHA-256. The key ships with the open-source client,
 * so a determined reverse-engineer can still forge a save; only a server can
 * make an economy tamper-proof against the owner of the browser. Everything
 * here is designed to make casual console/localStorage cheating fail closed.
 */

export const SECURITY_VERSION = 1;
export const SAVE_PREFIX = "AC1";
export const GUARD_PREFIX = "ACG1";
export const STARTING_COINS = 120;
export const MAX_COIN_BALANCE = 250_000;
export const MAX_XP_BALANCE = 1_000_000;
export const MAX_COINS_PER_GRANT = 6_000;
export const MAX_XP_PER_GRANT = 20_000;
export const MAX_LEDGER_ENTRIES = 128;
export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export const SAVE_STORAGE_KEYS = {
  primary: "blitz-league-save",
  mirror: "blitz-league-save-mirror",
  guard: "blitz-league-guard",
  guardSession: "blitz-league-guard-session",
  legacy: "soccer-baseboard-save",
} as const;

/**
 * Assembled at runtime so the literal does not appear as a searchable string
 * in the bundle. This is obfuscation, not secrecy: the code is open source.
 */
const KEY_CODES = [
  66, 108, 105, 116, 122, 45, 76, 101, 97, 103, 117, 101, 45,
  83, 97, 118, 101, 45, 86, 101, 114, 105, 102, 105, 101, 114, 45,
  50, 48, 50, 54, 45, 48, 49,
];
export const INTEGRITY_KEY = `${String.fromCharCode(...KEY_CODES)}::hmac-v1`;

export type Currency = "coins" | "xp";
export type TransactionKind = "earn" | "spend";

export type TransactionRule = {
  kind: TransactionKind;
  currency: Currency;
  maxAmount: number;
};

/**
 * Every economy mutation must use one of these reasons. Adding a new reward
 * means adding a rule here, which is also the moment to decide its ceiling.
 */
export const TRANSACTION_RULES: Record<string, TransactionRule> = {
  "tutorial-xp": { kind: "earn", currency: "xp", maxAmount: 150 },
  "tutorial-coins": { kind: "earn", currency: "coins", maxAmount: 50 },
  "match-xp": { kind: "earn", currency: "xp", maxAmount: 12_000 },
  "match-coins": { kind: "earn", currency: "coins", maxAmount: 600 },
  "rush-xp": { kind: "earn", currency: "xp", maxAmount: MAX_XP_PER_GRANT },
  "rush-coins": { kind: "earn", currency: "coins", maxAmount: MAX_COINS_PER_GRANT },
  "pass-coins": { kind: "earn", currency: "coins", maxAmount: 500 },
  "crate-bonus": { kind: "earn", currency: "coins", maxAmount: 75 },
  "duplicate-color": { kind: "earn", currency: "coins", maxAmount: 25 },
  "xp-purchase": { kind: "earn", currency: "xp", maxAmount: 1_500 },
  "xp-purchase-spend": { kind: "spend", currency: "coins", maxAmount: 250 },
  "crate-spend": { kind: "spend", currency: "coins", maxAmount: 350 },
  "daily-offer-spend": { kind: "spend", currency: "coins", maxAmount: 2_000 },
};

export type LedgerEntry = {
  id: string;
  seq: number;
  kind: TransactionKind;
  currency: Currency;
  amount: number;
  reason: string;
  at: number;
  prev: string;
  hash: string;
};

export type Wallet = {
  coins: number;
  xp: number;
  earnedCoins: number;
  spentCoins: number;
  earnedXp: number;
  txCount: number;
  baseSeq: number;
  baseHash: string;
  lastHash: string;
  ledger: LedgerEntry[];
};

export type WalletIssue = {
  code: string;
  detail: string;
};

export type NewTransaction = {
  kind: TransactionKind;
  currency: Currency;
  amount: number;
  reason: string;
  id?: string;
  at?: number;
};

export type WalletOptions = {
  maxXp?: number;
  key?: string;
};

export type WalletValidation =
  | { ok: true }
  | { ok: false; issue: WalletIssue };

export type TransactionResult =
  | { ok: true; wallet: Wallet; entries: LedgerEntry[] }
  | { ok: false; wallet: Wallet; issue: WalletIssue; index: number };

export type SavePayload = {
  securityVersion: number;
  progressionVersion: number;
  saveCounter: number;
  savedAt: number;
  installId: string;
  wallet: Wallet;
  xp: number;
  coins: number;
  [key: string]: unknown;
};

export type SaveGuard = {
  installId: string;
  counter: number;
  digest: string;
  savedAt: number;
};

export type SaveDecodeResult =
  | { ok: true; payload: SavePayload; digest: string; key: string }
  | { ok: false; code: string; detail: string; signed: boolean };

export type GuardDecodeResult =
  | { ok: true; guard: SaveGuard; key: string }
  | { ok: false; code: string; detail: string };

export type SaveOptions = {
  now?: number;
  maxXp?: number;
  progressionVersion?: number;
};

export type LegacyWalletResult = {
  wallet: Wallet;
  clampedCoins: boolean;
  clampedXp: boolean;
  coinCap: number;
};

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (value: number, bits: number): number =>
  (value >>> bits) | (value << (32 - bits));

const bytesToHex = (bytes: Uint8Array): string => {
  let output = "";
  for (let index = 0; index < bytes.length; index += 1) {
    output += bytes[index].toString(16).padStart(2, "0");
  }
  return output;
};

const sha256Bytes = (input: Uint8Array): Uint8Array => {
  const bitLength = input.length * 8;
  const paddedLength = (((input.length + 9) + 63) >> 6) << 6;
  const data = new Uint8Array(paddedLength);
  data.set(input);
  data[input.length] = 0x80;
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength % 0x100000000;
  data[paddedLength - 8] = (high >>> 24) & 0xff;
  data[paddedLength - 7] = (high >>> 16) & 0xff;
  data[paddedLength - 6] = (high >>> 8) & 0xff;
  data[paddedLength - 5] = high & 0xff;
  data[paddedLength - 4] = (low >>> 24) & 0xff;
  data[paddedLength - 3] = (low >>> 16) & 0xff;
  data[paddedLength - 2] = (low >>> 8) & 0xff;
  data[paddedLength - 1] = low & 0xff;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const byteIndex = offset + index * 4;
      words[index] = (
        (data[byteIndex] << 24)
        | (data[byteIndex + 1] << 16)
        | (data[byteIndex + 2] << 8)
        | data[byteIndex + 3]
      ) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15];
      const previous2 = words[index - 2];
      const s0 = rotr(previous15, 7) ^ rotr(previous15, 18) ^ (previous15 >>> 3);
      const s1 = rotr(previous2, 17) ^ rotr(previous2, 19) ^ (previous2 >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const output = new Uint8Array(32);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((word, index) => {
    output[index * 4] = (word >>> 24) & 0xff;
    output[index * 4 + 1] = (word >>> 16) & 0xff;
    output[index * 4 + 2] = (word >>> 8) & 0xff;
    output[index * 4 + 3] = word & 0xff;
  });
  return output;
};

export const sha256Hex = (text: string): string =>
  bytesToHex(sha256Bytes(new TextEncoder().encode(text)));

const hmacSha256 = (key: string, message: string): string => {
  const blockSize = 64;
  let keyBytes = new TextEncoder().encode(key);
  if (keyBytes.length > blockSize) keyBytes = new Uint8Array(sha256Bytes(keyBytes));
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);
  const messageBytes = new TextEncoder().encode(message);
  const inner = new Uint8Array(blockSize + messageBytes.length);
  const outer = new Uint8Array(blockSize + 32);
  for (let index = 0; index < blockSize; index += 1) {
    inner[index] = paddedKey[index] ^ 0x36;
    outer[index] = paddedKey[index] ^ 0x5c;
  }
  inner.set(messageBytes, blockSize);
  outer.set(sha256Bytes(inner), blockSize);
  return bytesToHex(sha256Bytes(outer));
};

export const deriveSaveKey = (secret: string, installId: string): string =>
  hmacSha256(secret, `blitz-install|${installId}|${SECURITY_VERSION}`);

const constantTimeEqual = (left: string, right: string): boolean => {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
};

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

const BASE64_URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += BASE64_URL[first >> 2];
    output += BASE64_URL[((first & 3) << 4) | ((second ?? 0) >> 4)];
    if (second === undefined) break;
    output += BASE64_URL[((second & 15) << 2) | ((third ?? 0) >> 6)];
    if (third === undefined) break;
    output += BASE64_URL[third & 63];
  }
  return output;
};

const base64UrlToBytes = (text: string): Uint8Array | null => {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  const bytes: number[] = [];
  for (let index = 0; index < text.length; index += 4) {
    const a = BASE64_URL.indexOf(text[index]);
    const b = BASE64_URL.indexOf(text[index + 1] ?? "A");
    const c = BASE64_URL.indexOf(text[index + 2] ?? "A");
    const d = BASE64_URL.indexOf(text[index + 3] ?? "A");
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    bytes.push((a << 2) | (b >> 4));
    if (text[index + 2] !== undefined) bytes.push(((b & 15) << 4) | (c >> 2));
    if (text[index + 3] !== undefined) bytes.push(((c & 3) << 6) | d);
  }
  return new Uint8Array(bytes);
};

/**
 * Stable JSON so a payload always produces the same signature regardless of
 * object key insertion order. That also makes the mirror/guard digest stable.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === undefined) return "null";
  if (value === null) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return "null";
};

const encodeEnvelope = (prefix: string, payload: unknown, key: string): string => {
  const json = canonicalJson(payload);
  const body = bytesToBase64Url(new TextEncoder().encode(json));
  const signature = hmacSha256(key, `${prefix}|${json}`);
  return `${prefix}:${body}:${signature}`;
};

const decodeEnvelope = (raw: string, prefix: string, key: string):
  { ok: true; value: unknown; digest: string } | { ok: false; code: string; detail: string } => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(`${prefix}:`)) {
    return { ok: false, code: "unsigned", detail: "Save does not use the protected format." };
  }
  const parts = trimmed.split(":");
  if (parts.length !== 3) {
    return { ok: false, code: "malformed", detail: "Protected save envelope is malformed." };
  }
  const [, body, signature] = parts;
  const bytes = base64UrlToBytes(body);
  if (!bytes) {
    return { ok: false, code: "malformed", detail: "Protected save body is not valid base64url." };
  }
  let json = "";
  try {
    json = new TextDecoder().decode(bytes);
  } catch {
    return { ok: false, code: "malformed", detail: "Protected save body is not valid UTF-8." };
  }
  const expected = hmacSha256(key, `${prefix}|${json}`);
  if (!constantTimeEqual(signature, expected)) {
    return { ok: false, code: "bad-signature", detail: "Save signature does not match its contents." };
  }
  try {
    return { ok: true, value: JSON.parse(json), digest: sha256Hex(trimmed) };
  } catch {
    return { ok: false, code: "malformed", detail: "Protected save payload is not valid JSON." };
  }
};

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export const createWallet = (): Wallet => ({
  coins: STARTING_COINS,
  xp: 0,
  earnedCoins: 0,
  spentCoins: 0,
  earnedXp: 0,
  txCount: 0,
  baseSeq: 0,
  baseHash: GENESIS_HASH,
  lastHash: GENESIS_HASH,
  ledger: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isSafeInteger(value);

const nonNegativeInteger = (value: unknown): value is number =>
  isInteger(value) && value >= 0;

const positiveInteger = (value: unknown): value is number =>
  isInteger(value) && value > 0;

const issue = (code: string, detail: string): WalletIssue => ({ code, detail });

const maxXpFor = (options: WalletOptions): number =>
  Math.min(MAX_XP_BALANCE, Math.max(0, Math.floor(options.maxXp ?? MAX_XP_BALANCE)));

const entryPayload = (entry: Omit<LedgerEntry, "hash">): string =>
  [
    entry.id,
    entry.seq,
    entry.kind,
    entry.currency,
    entry.amount,
    entry.reason,
    entry.at,
    entry.prev,
  ].join("|");

const entryHash = (key: string, entry: Omit<LedgerEntry, "hash">): string =>
  hmacSha256(key, `ledger|${entryPayload(entry)}`);

const pruneLedger = (wallet: Wallet): Wallet => {
  if (wallet.ledger.length <= MAX_LEDGER_ENTRIES) return wallet;
  const removeCount = wallet.ledger.length - MAX_LEDGER_ENTRIES;
  const removed = wallet.ledger.slice(0, removeCount);
  const kept = wallet.ledger.slice(removeCount);
  const lastRemoved = removed[removed.length - 1];
  return {
    ...wallet,
    ledger: kept,
    baseSeq: lastRemoved.seq,
    baseHash: lastRemoved.hash,
  };
};

const validateEntry = (entry: unknown, key: string | undefined): WalletIssue | null => {
  if (!isRecord(entry)) return issue("ledger-entry", "Ledger entry is not an object.");
  if (typeof entry.id !== "string" || entry.id.length === 0 || entry.id.length > 128) {
    return issue("ledger-id", "Ledger entry id is invalid.");
  }
  if (!positiveInteger(entry.seq)) return issue("ledger-seq", "Ledger sequence is invalid.");
  if (entry.kind !== "earn" && entry.kind !== "spend") {
    return issue("ledger-kind", "Ledger transaction kind is invalid.");
  }
  if (entry.currency !== "coins" && entry.currency !== "xp") {
    return issue("ledger-currency", "Ledger currency is invalid.");
  }
  if (!positiveInteger(entry.amount)) return issue("ledger-amount", "Ledger amount is invalid.");
  if (typeof entry.reason !== "string" || !TRANSACTION_RULES[entry.reason]) {
    return issue("ledger-reason", "Ledger transaction reason is not recognised.");
  }
  if (!nonNegativeInteger(entry.at)) return issue("ledger-time", "Ledger timestamp is invalid.");
  if (typeof entry.prev !== "string" || !/^[a-f0-9]{64}$/.test(entry.prev)) {
    return issue("ledger-prev", "Ledger chain link is invalid.");
  }
  if (typeof entry.hash !== "string" || !/^[a-f0-9]{64}$/.test(entry.hash)) {
    return issue("ledger-hash", "Ledger hash is invalid.");
  }
  if (key) {
    const expected = entryHash(key, entry as unknown as Omit<LedgerEntry, "hash">);
    if (!constantTimeEqual(entry.hash, expected)) {
      return issue("ledger-hash", "Ledger hash does not match its transaction.");
    }
  }
  return null;
};

export const validateWallet = (wallet: unknown, options: WalletOptions = {}): WalletValidation => {
  if (!isRecord(wallet)) return { ok: false, issue: issue("wallet-shape", "Wallet is not an object.") };
  const maxXp = maxXpFor(options);
  const fields = ["coins", "xp", "earnedCoins", "spentCoins", "earnedXp", "txCount", "baseSeq"] as const;
  for (const field of fields) {
    if (!nonNegativeInteger(wallet[field])) {
      return { ok: false, issue: issue("wallet-number", `Wallet ${field} is not a non-negative integer.`) };
    }
  }
  const coins = wallet.coins as number;
  const xp = wallet.xp as number;
  const earnedCoins = wallet.earnedCoins as number;
  const spentCoins = wallet.spentCoins as number;
  const earnedXp = wallet.earnedXp as number;
  const txCount = wallet.txCount as number;
  const baseSeq = wallet.baseSeq as number;
  if (coins > MAX_COIN_BALANCE) {
    return { ok: false, issue: issue("wallet-coins-cap", `Wallet balance exceeds the ${MAX_COIN_BALANCE} coin ceiling.`) };
  }
  if (xp > maxXp) {
    return { ok: false, issue: issue("wallet-xp-cap", "Wallet XP exceeds the Season Pass ceiling.") };
  }
  if (earnedCoins > MAX_COIN_BALANCE) {
    return { ok: false, issue: issue("wallet-earned-cap", "Lifetime coin earnings exceed the ceiling.") };
  }
  if (spentCoins > STARTING_COINS + earnedCoins) {
    return { ok: false, issue: issue("wallet-spent", "Lifetime spending exceeds lifetime available coins.") };
  }
  if (coins !== STARTING_COINS + earnedCoins - spentCoins) {
    return { ok: false, issue: issue("wallet-conservation", "Coin balance does not conserve earnings and spending.") };
  }
  if (xp !== earnedXp) {
    return { ok: false, issue: issue("wallet-xp", "XP balance does not match lifetime XP earnings.") };
  }
  if (typeof wallet.baseHash !== "string" || !/^[a-f0-9]{64}$/.test(wallet.baseHash)) {
    return { ok: false, issue: issue("wallet-base", "Wallet base hash is invalid.") };
  }
  if (typeof wallet.lastHash !== "string" || !/^[a-f0-9]{64}$/.test(wallet.lastHash)) {
    return { ok: false, issue: issue("wallet-last", "Wallet head hash is invalid.") };
  }
  if (!Array.isArray(wallet.ledger)) {
    return { ok: false, issue: issue("wallet-ledger", "Wallet ledger is not an array.") };
  }
  if (wallet.ledger.length > MAX_LEDGER_ENTRIES) {
    return { ok: false, issue: issue("wallet-ledger-length", "Wallet ledger is longer than the allowed window.") };
  }
  if (txCount !== baseSeq + wallet.ledger.length) {
    return { ok: false, issue: issue("wallet-count", "Wallet transaction count does not match its chain window.") };
  }

  const ids = new Set<string>();
  let previous = wallet.baseHash;
  for (let index = 0; index < wallet.ledger.length; index += 1) {
    const entry = wallet.ledger[index];
    const entryIssue = validateEntry(entry, options.key);
    if (entryIssue) return { ok: false, issue: entryIssue };
    const typed = entry as LedgerEntry;
    if (typed.seq !== baseSeq + index + 1) {
      return { ok: false, issue: issue("ledger-seq", "Ledger sequence is not contiguous.") };
    }
    if (typed.prev !== previous) {
      return { ok: false, issue: issue("ledger-chain", "Ledger chain link is broken.") };
    }
    if (ids.has(typed.id)) {
      return { ok: false, issue: issue("ledger-replay", "Ledger contains a replayed transaction id.") };
    }
    ids.add(typed.id);
    previous = typed.hash;
  }
  if (wallet.lastHash !== previous) {
    return { ok: false, issue: issue("ledger-head", "Wallet head hash does not match the ledger.") };
  }
  return { ok: true };
};

export const applyTransactions = (
  wallet: Wallet,
  transactions: NewTransaction[],
  key: string,
  options: { now?: number; maxXp?: number; idFactory?: () => string } = {},
): TransactionResult => {
  const initialValidation = validateWallet(wallet, { maxXp: options.maxXp, key });
  if (!initialValidation.ok) {
    return { ok: false, wallet, issue: initialValidation.issue, index: -1 };
  }
  const maxXp = maxXpFor(options);
  const now = nonNegativeInteger(options.now) ? options.now : Date.now();
  const idFactory = options.idFactory ?? (() => {
    const cryptoObject = globalThis.crypto as Crypto | undefined;
    if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
    return `${now.toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  });
  let next = wallet;
  const entries: LedgerEntry[] = [];

  for (let index = 0; index < transactions.length; index += 1) {
    const transaction = transactions[index];
    const rule = TRANSACTION_RULES[transaction.reason];
    if (!rule) {
      return { ok: false, wallet, issue: issue("tx-reason", `Unknown transaction reason: ${transaction.reason}.`), index };
    }
    if (transaction.kind !== rule.kind) {
      return { ok: false, wallet, issue: issue("tx-kind", `Reason ${transaction.reason} is not a ${transaction.kind} transaction.`), index };
    }
    if (transaction.currency !== rule.currency) {
      return { ok: false, wallet, issue: issue("tx-currency", `Reason ${transaction.reason} must use ${rule.currency}.`), index };
    }
    if (!positiveInteger(transaction.amount)) {
      return { ok: false, wallet, issue: issue("tx-amount", "Transaction amount must be a positive integer."), index };
    }
    if (transaction.amount > rule.maxAmount) {
      return { ok: false, wallet, issue: issue("tx-ceiling", `Reason ${transaction.reason} is capped at ${rule.maxAmount}.`), index };
    }
    const id = transaction.id ?? idFactory();
    if (typeof id !== "string" || id.length === 0 || id.length > 128) {
      return { ok: false, wallet, issue: issue("tx-id", "Transaction id is invalid."), index };
    }
    if (next.ledger.some((entry) => entry.id === id)) {
      return { ok: false, wallet, issue: issue("tx-replay", "Duplicate transaction id."), index };
    }
    const at = transaction.at ?? now;
    if (!nonNegativeInteger(at)) {
      return { ok: false, wallet, issue: issue("tx-time", "Transaction timestamp is invalid."), index };
    }

    let coins = next.coins;
    let xp = next.xp;
    let earnedCoins = next.earnedCoins;
    let spentCoins = next.spentCoins;
    let earnedXp = next.earnedXp;

    if (transaction.currency === "coins") {
      if (transaction.kind === "spend") {
        if (transaction.amount > coins) {
          return { ok: false, wallet, issue: issue("tx-overspend", "Transaction spends more coins than are available."), index };
        }
        coins -= transaction.amount;
        spentCoins += transaction.amount;
      } else {
        if (earnedCoins + transaction.amount > MAX_COIN_BALANCE) {
          return { ok: false, wallet, issue: issue("tx-earned-cap", "Transaction would exceed lifetime coin earnings ceiling."), index };
        }
        coins += transaction.amount;
        earnedCoins += transaction.amount;
        if (coins > MAX_COIN_BALANCE) {
          return { ok: false, wallet, issue: issue("tx-coins-cap", "Transaction would exceed the coin balance ceiling."), index };
        }
      }
    } else if (transaction.kind === "spend") {
      return { ok: false, wallet, issue: issue("tx-xp-spend", "XP cannot be spent in the current economy."), index };
    } else {
      if (xp + transaction.amount > maxXp) {
        return { ok: false, wallet, issue: issue("tx-xp-cap", "Transaction would exceed the Season Pass XP ceiling."), index };
      }
      xp += transaction.amount;
      earnedXp += transaction.amount;
    }

    const prev = next.lastHash;
    const seq = next.txCount + 1;
    const unsignedEntry: Omit<LedgerEntry, "hash"> = {
      id,
      seq,
      kind: transaction.kind,
      currency: transaction.currency,
      amount: transaction.amount,
      reason: transaction.reason,
      at,
      prev,
    };
    const entry: LedgerEntry = { ...unsignedEntry, hash: entryHash(key, unsignedEntry) };
    next = pruneLedger({
      ...next,
      coins,
      xp,
      earnedCoins,
      spentCoins,
      earnedXp,
      txCount: seq,
      lastHash: entry.hash,
      ledger: [...next.ledger, entry],
    });
    entries.push(entry);
  }

  const validation = validateWallet(next, { maxXp, key });
  if (!validation.ok) return { ok: false, wallet, issue: validation.issue, index: transactions.length };
  return { ok: true, wallet: next, entries };
};

/**
 * Legacy (unsigned) saves get one conservative migration. Coins are capped by
 * a bound derived from lifetime XP, which in turn caps what a forged old save
 * can bring into the protected economy. After this, the save is signed.
 */
export const legacyCoinCapForXp = (xp: number): number => {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return Math.min(100_000, Math.max(2_000, 2_000 + Math.floor(safeXp * 0.5)));
};

export const walletFromLegacy = (data: unknown, options: { maxXp?: number } = {}): LegacyWalletResult => {
  const record = isRecord(data) ? data : {};
  const maxXp = maxXpFor(options);
  const rawXp = nonNegativeInteger(record.xp) ? record.xp : 0;
  const rawCoins = nonNegativeInteger(record.coins) ? record.coins : STARTING_COINS;
  const xp = Math.min(rawXp, maxXp);
  const coinCap = legacyCoinCapForXp(xp);
  const coins = Math.min(rawCoins, coinCap);
  const earnedCoins = Math.max(0, coins - STARTING_COINS);
  const spentCoins = Math.max(0, STARTING_COINS - coins);
  return {
    wallet: {
      coins,
      xp,
      earnedCoins,
      spentCoins,
      earnedXp: xp,
      txCount: 0,
      baseSeq: 0,
      baseHash: GENESIS_HASH,
      lastHash: GENESIS_HASH,
      ledger: [],
    },
    clampedCoins: rawCoins > coins,
    clampedXp: rawXp > xp,
    coinCap,
  };
};

// ---------------------------------------------------------------------------
// Save envelope
// ---------------------------------------------------------------------------

export const validateSavePayload = (payload: unknown, options: SaveOptions & { key?: string } = {}):
  { ok: true; payload: SavePayload } | { ok: false; issue: WalletIssue } => {
  if (!isRecord(payload)) return { ok: false, issue: issue("save-shape", "Save payload is not an object.") };
  if (payload.securityVersion !== SECURITY_VERSION) {
    return { ok: false, issue: issue("save-version", "Save security version is not supported.") };
  }
  if (!nonNegativeInteger(payload.progressionVersion)) {
    return { ok: false, issue: issue("save-progression", "Save progression version is missing.") };
  }
  if (options.progressionVersion !== undefined && payload.progressionVersion !== options.progressionVersion) {
    return { ok: false, issue: issue("save-progression", "Save progression version is out of date.") };
  }
  if (!positiveInteger(payload.saveCounter)) {
    return { ok: false, issue: issue("save-counter", "Save counter is invalid.") };
  }
  if (!nonNegativeInteger(payload.savedAt)) {
    return { ok: false, issue: issue("save-time", "Save timestamp is invalid.") };
  }
  if (typeof payload.installId !== "string" || payload.installId.length < 8 || payload.installId.length > 128) {
    return { ok: false, issue: issue("save-install", "Save install id is invalid.") };
  }
  if (!isInteger(payload.xp) || !isInteger(payload.coins)) {
    return { ok: false, issue: issue("save-balance", "Save balance mirrors are missing.") };
  }
  const walletValidation = validateWallet(payload.wallet, {
    maxXp: options.maxXp,
    key: options.key,
  });
  if (!walletValidation.ok) return { ok: false, issue: walletValidation.issue };
  const wallet = payload.wallet as Wallet;
  if (payload.xp !== wallet.xp || payload.coins !== wallet.coins) {
    return { ok: false, issue: issue("save-mismatch", "Save balance mirrors do not match the protected wallet.") };
  }
  return { ok: true, payload: payload as SavePayload };
};

export const createInstallId = (): string => {
  const cryptoObject = globalThis.crypto as Crypto | undefined;
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  return `install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const encodeSave = (payload: SavePayload, secret = INTEGRITY_KEY): string => {
  const key = deriveSaveKey(secret, payload.installId);
  return encodeEnvelope(SAVE_PREFIX, payload, key);
};

export const decodeSave = (raw: string, secret = INTEGRITY_KEY, options: SaveOptions = {}): SaveDecodeResult => {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed.startsWith(`${SAVE_PREFIX}:`)) {
    return { ok: false, code: "unsigned", detail: "Save is unsigned.", signed: false };
  }
  let installId = "";
  try {
    const parts = trimmed.split(":");
    if (parts.length === 3) {
      const bytes = base64UrlToBytes(parts[1]);
      if (bytes) {
        const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
        if (typeof parsed.installId === "string") installId = parsed.installId;
      }
    }
  } catch {
    return { ok: false, code: "malformed", detail: "Protected save cannot be decoded.", signed: true };
  }
  if (!installId) {
    return { ok: false, code: "malformed", detail: "Protected save has no install id.", signed: true };
  }
  const key = deriveSaveKey(secret, installId);
  const decoded = decodeEnvelope(trimmed, SAVE_PREFIX, key);
  if (!decoded.ok) return { ...decoded, signed: true };
  const validation = validateSavePayload(decoded.value, { ...options, key });
  if (!validation.ok) {
    return { ok: false, code: validation.issue.code, detail: validation.issue.detail, signed: true };
  }
  return { ok: true, payload: validation.payload, digest: decoded.digest, key };
};

export const encodeGuard = (guard: SaveGuard, secret = INTEGRITY_KEY): string => {
  const key = deriveSaveKey(secret, guard.installId);
  return encodeEnvelope(GUARD_PREFIX, guard, key);
};

export const decodeGuard = (raw: string, secret = INTEGRITY_KEY): GuardDecodeResult => {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed.startsWith(`${GUARD_PREFIX}:`)) {
    return { ok: false, code: "unsigned", detail: "Guard is unsigned." };
  }
  let installId = "";
  try {
    const parts = trimmed.split(":");
    if (parts.length === 3) {
      const bytes = base64UrlToBytes(parts[1]);
      if (bytes) {
        const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
        if (typeof parsed.installId === "string") installId = parsed.installId;
      }
    }
  } catch {
    return { ok: false, code: "malformed", detail: "Guard cannot be decoded." };
  }
  if (!installId) return { ok: false, code: "malformed", detail: "Guard has no install id." };
  const key = deriveSaveKey(secret, installId);
  const decoded = decodeEnvelope(trimmed, GUARD_PREFIX, key);
  if (!decoded.ok) return decoded;
  const guard = decoded.value;
  if (!isRecord(guard)) return { ok: false, code: "malformed", detail: "Guard is not an object." };
  if (guard.installId !== installId) return { ok: false, code: "malformed", detail: "Guard install id does not match." };
  if (!positiveInteger(guard.counter)) return { ok: false, code: "malformed", detail: "Guard counter is invalid." };
  if (typeof guard.digest !== "string" || !/^[a-f0-9]{64}$/.test(guard.digest)) {
    return { ok: false, code: "malformed", detail: "Guard digest is invalid." };
  }
  if (!nonNegativeInteger(guard.savedAt)) return { ok: false, code: "malformed", detail: "Guard timestamp is invalid." };
  return { ok: true, guard: guard as SaveGuard, key };
};

export const checkGuard = (
  payload: Pick<SavePayload, "installId" | "saveCounter">,
  digest: string,
  guard: SaveGuard | null,
): { ok: true } | { ok: false; code: "rollback" | "replaced"; detail: string } => {
  if (!guard) return { ok: true };
  if (guard.installId !== payload.installId) return { ok: true };
  if (payload.saveCounter < guard.counter) {
    return {
      ok: false,
      code: "rollback",
      detail: `Save counter ${payload.saveCounter} is older than the protected counter ${guard.counter}.`,
    };
  }
  if (payload.saveCounter === guard.counter && digest !== guard.digest) {
    return {
      ok: false,
      code: "replaced",
      detail: "Save content does not match the protected copy at the same counter.",
    };
  }
  return { ok: true };
};

/**
 * A human-readable reason for the reset notice. Deliberately does not expose
 * stack traces or internal state to the page.
 */
export const describeSaveFailure = (code: string): string => {
  switch (code) {
    case "rollback": return "An older save was restored.";
    case "replaced": return "A save was replaced with different contents.";
    case "bad-signature": return "The save signature is invalid.";
    case "save-mismatch": return "The save balances do not match the protected wallet.";
    case "ledger-replay": return "A reward was replayed.";
    case "tx-replay": return "A reward transaction was replayed.";
    case "tx-overspend": return "A purchase spent more than the available balance.";
    case "tx-ceiling": return "A reward exceeded its published limit.";
    case "wallet-coins-cap": return "The coin balance exceeded the protected ceiling.";
    case "wallet-conservation": return "The coin balance did not conserve earnings and spending.";
    default: return "The save failed its integrity check.";
  }
};
