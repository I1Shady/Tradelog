import express from "express";
import "dotenv/config";
import cors from "cors";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${Buffer.from(key).toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, keyHex] = String(storedHash).split(":");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, "hex"), expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || "https://i1shady.github.io,http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean)
);

app.disable("x-powered-by");
// Render and similar platforms sit behind one trusted reverse proxy.
if (isProduction) app.set("trust proxy", 1);
app.use((req, res, next) => {
  const limit = req.path === "/api/transcribe" ? "50mb" : "1mb";
  express.json({ limit })(req, res, next);
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Requested-With"],
}));

app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin || !allowedOrigins.has(origin.replace(/\/$/, "")) || req.get("x-requested-with") !== "XMLHttpRequest") {
    return res.status(403).json({ error: "Untrusted request origin" });
  }
  next();
});

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? ["", ""] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(([key]) => key));
}
function setSessionCookie(res, token) {
  const secure = isProduction ? "; Secure" : "";
  const sameSite = isProduction ? "None" : "Lax";
  res.setHeader("Set-Cookie", `tradelog_session=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=2592000${secure}`);
}
function clearSessionCookie(res) {
  const secure = isProduction ? "; Secure" : "";
  const sameSite = isProduction ? "None" : "Lax";
  res.setHeader("Set-Cookie", `tradelog_session=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`);
}
const publicUser = (user) => ({ id: user.id, email: user.email, createdAt: user.created_at });
function createSession(userId, res) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(userId, sha256(token), expiresAt);
  setSessionCookie(res, token);
}
app.use("/api", (req, _res, next) => {
  const token = cookies(req).tradelog_session;
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
    req.user = db.prepare(`
      SELECT users.id, users.email, users.created_at FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(sha256(token), new Date().toISOString());
  }
  next();
});
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  next();
}
const rateLimits = new Map();
function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  return (req, res, next) => {
    const now = Date.now(), id = key(req), current = rateLimits.get(id);
    if (!current || now - current.startedAt >= windowMs) {
      rateLimits.set(id, { startedAt: now, count: 1 }); return next();
    }
    if (++current.count > max) {
      res.set("Retry-After", String(Math.ceil((windowMs - (now - current.startedAt)) / 1000)));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  };
}
const authLimit = rateLimit({ windowMs: 900000, max: 10 });
const aiLimit = rateLimit({ windowMs: 60000, max: 8, key: (req) => String(req.user?.id || req.ip) });

app.get("/", (_req, res) => res.json({ message: "TradeLog API is running" }));

app.post("/api/auth/register", authLimit, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 10 || password.length > 128)
      return res.status(400).json({ error: "Password must be between 10 and 128 characters." });
    const passwordHash = await hashPassword(password);
    const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, passwordHash);
    const user = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(result.lastInsertRowid);
    createSession(user.id, res);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (String(error?.code || "").includes("SQLITE_CONSTRAINT"))
      return res.status(409).json({ error: "An account with this email already exists." });
    console.error("Register error:", error);
    res.status(500).json({ error: "Unable to create account." });
  }
});
app.post("/api/auth/login", authLimit, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = db.prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE").get(email);
    if (!user || !(await verifyPassword(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid email or password." });
    createSession(user.id, res);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Unable to sign in." });
  }
});
app.get("/api/auth/me", (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));
app.post("/api/auth/logout", (req, res) => {
  const token = cookies(req).tradelog_session;
  if (token && /^[a-f0-9]{64}$/i.test(token))
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  clearSessionCookie(res);
  res.json({ success: true });
});

app.get("/api/trades", requireAuth, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
    res.json(rows.map(formatTradeRow));
  } catch (error) {
    console.error("GET trades:", error); res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/trades/:id", requireAuth, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid trade ID" });
  try {
    const row = db.prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?").get(id, req.user.id);
    if (!row) return res.status(404).json({ message: "Trade not found" });
    res.json(formatTradeRow(row));
  } catch (error) {
    console.error("GET trade:", error); res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/trades", requireAuth, (req, res) => {
  try {
    const b = req.body || {};
    const result = db.prepare(`
      INSERT INTO journal_entries (
        user_id, symbol, exchange, timeframe, side, entry_price, margin, leverage,
        order_value, order_type, mental, strategy, mistakes, checklist, notes,
        stop_loss, take_profit, position_pct, pnl_amount, pnl_currency, pnl_result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, b.symbol ?? null, b.exchange ?? null, b.timeframe ?? null, b.side ?? null,
      b.entry_price ?? null, b.margin ?? null, b.leverage ?? null, b.order_value ?? null, b.order_type ?? null,
      b.mental ?? null, b.strategy ?? null, b.mistakes ?? null, b.checklist == null ? null : JSON.stringify(b.checklist),
      b.notes ?? null, b.stop_loss ?? null, b.take_profit ?? null, b.position_pct ?? null,
      b.pnl_amount ?? null, b.pnl_currency ?? null, b.pnl_result ?? null);
    const row = db.prepare("SELECT * FROM journal_entries WHERE id = ? AND user_id = ?").get(result.lastInsertRowid, req.user.id);
    res.status(201).json(formatTradeRow(row));
  } catch (error) {
    console.error("POST trade:", error); res.status(500).json({ error: "Unable to save trade." });
  }
});
app.put("/api/trades/:id", requireAuth, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid trade ID" });
  const fieldMap = {
    date: "trade_date", symbol: "symbol", exchange: "exchange", timeframe: "timeframe", side: "side",
    entryPrice: "entry_price", positionMargin: "margin", leverage: "leverage", orderValue: "order_value",
    orderType: "order_type", entryScreenshot: "entry_screenshot", mentalState: "mental", strategy: "strategy",
    mistakes: "mistakes", checkItems: "checklist", notes: "notes", stopLoss: "stop_loss",
    takeProfit: "take_profit", exitScreenshot: "exit_screenshot", positionToAcc: "position_pct",
    pnl: "pnl_amount", exitType: "pnl_result",
  };
  const entries = Object.entries(req.body || {}).filter(([key, value]) =>
    key !== "id" && key !== "status" && Object.hasOwn(fieldMap, key) && value !== undefined);
  if (!entries.length) return res.status(400).json({ error: "No valid fields provided" });
  try {
    const values = [];
    const assignments = entries.map(([key, value]) => {
      values.push(key === "checkItems" && value !== null ? JSON.stringify(value) : value);
      return `"${fieldMap[key]}" = ?`;
    });
    values.push(id, req.user.id);
    const row = db.prepare(`UPDATE journal_entries SET ${assignments.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`).get(...values);
    if (!row) return res.status(404).json({ message: "Trade not found" });
    res.json(formatTradeRow(row));
  } catch (error) {
    console.error("PUT trade:", error); res.status(500).json({ error: "Unable to update trade." });
  }
});

app.post("/api/transcribe", requireAuth, aiLimit, async (req, res) => {
  try {
    const { audio, mimeType = "audio/webm" } = req.body || {};
    if (typeof audio !== "string" || !audio.length) return res.status(400).json({ error: "Audio data is required." });
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: "OpenRouter API key is not configured." });
    const format = mimeType.includes("mp4") ? "m4a" : mimeType.includes("wav") ? "wav" : "webm";
    const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "X-OpenRouter-Title": "TradeLog Voice Journal" },
      body: JSON.stringify({ model: "openai/whisper-1", input_audio: { data: audio, format } }),
    });
    const result = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: result.error?.message || "Transcription failed." });
    res.json({ text: result.text || "" });
  } catch (error) {
    console.error("Transcription error:", error); res.status(500).json({ error: "Transcription failed." });
  }
});
app.post("/api/process-voice", requireAuth, aiLimit, async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Prompt is required." });
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: "OpenRouter API key is not configured." });
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "X-OpenRouter-Title": "TradeLog Voice Journal" },
      body: JSON.stringify({ model: "deepseek/deepseek-v4.1-flash-1017", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    });
    const result = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: result.error?.message || "AI processing failed." });
    res.json({ trade: result.choices?.[0]?.message?.content || "" });
  } catch (error) {
    console.error("Process voice error:", error); res.status(500).json({ error: "AI processing failed." });
  }
});

function formatTradeRow(row) {
  let checkItems = row.checklist;
  if (typeof checkItems === "string") { try { checkItems = JSON.parse(checkItems); } catch { /* legacy data */ } }
  return {
    id: row.id, date: row.trade_date, symbol: row.symbol, exchange: row.exchange, timeframe: row.timeframe,
    side: row.side, entryPrice: row.entry_price, positionMargin: row.margin, leverage: row.leverage,
    orderValue: row.order_value, orderType: row.order_type, entryScreenshot: row.entry_screenshot,
    mentalState: row.mental, strategy: row.strategy, mistakes: row.mistakes, checkItems, notes: row.notes,
    stopLoss: row.stop_loss, takeProfit: row.take_profit, exitScreenshot: row.exit_screenshot,
    positionToAcc: row.position_pct, pnl: row.pnl_amount, status: row.pnl_amount !== null ? "closed" : "open",
    exitType: row.pnl_result,
  };
}
app.use((error, _req, res, _next) => {
  if (error.message === "Origin is not allowed by CORS") return res.status(403).json({ error: "Origin is not allowed." });
  console.error("Unhandled API error:", error); res.status(500).json({ error: "Internal server error" });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TradeLog API running on port ${PORT}`);
  db.prepare("SELECT 1").get();
  console.log("Connected to SQLite database");
});
