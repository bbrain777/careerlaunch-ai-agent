import "dotenv/config";
import cors from "cors";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import path from "node:path";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";
import { google } from "googleapis";

type AuthRequest = Request & { userId?: number };
const app = express();
const port = Number(process.env.PORT ?? 3001);
const jwtSecret = process.env.JWT_SECRET;
const appUrl = process.env.APP_URL ?? "http://localhost:3001";
const tokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required. Copy .env.example to .env before starting the API.");
}
if (!tokenEncryptionKey || Buffer.byteLength(tokenEncryptionKey) < 32) {
  throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 bytes. Copy .env.example and set a secure key.");
}

mkdirSync(path.resolve("data"), { recursive: true });
const db = new Database(path.resolve("data/careerlaunch.sqlite"));
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Saved', 'Preparing', 'Applied', 'Interview', 'Offer')),
    logo TEXT NOT NULL,
    tone TEXT NOT NULL,
    updated TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meta TEXT NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')),
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS source_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    received_at TEXT NOT NULL,
    message_type TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Ignored')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider, external_id)
  );
  CREATE TABLE IF NOT EXISTS integration_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    account_email TEXT,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    scopes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Connected',
    last_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
  );
`);

app.use(cors());
app.use(express.json());

function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: number };
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  function encrypt(value: string) {
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash("sha256").update(tokenEncryptionKey).digest();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
  }

  function gmailClient() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Google OAuth credentials are not configured");
    }
    return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI ?? `${appUrl}/api/integrations/gmail/callback`);
  }

  app.get("/api/integrations", auth, (req: AuthRequest, res) => {
    return res.json(db.prepare("SELECT provider, account_email AS accountEmail, status, last_synced_at AS lastSyncedAt FROM integration_connections WHERE user_id = ?").all(req.userId));
  });

  app.get("/api/integrations/gmail/connect", auth, (req: AuthRequest, res) => {
    try {
      const client = gmailClient();
      const state = jwt.sign({ userId: req.userId }, jwtSecret, { expiresIn: "10m" });
      return res.json({ url: client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["https://www.googleapis.com/auth/gmail.readonly"], state }) });
    } catch (error) {
      return res.status(503).json({ error: error instanceof Error ? error.message : "Gmail is not configured" });
    }
  });

  app.get("/api/integrations/gmail/callback", async (req, res) => {
    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string") return res.status(400).send("Missing OAuth callback parameters.");
    try {
      const { userId } = jwt.verify(state, jwtSecret) as { userId: number };
      const client = gmailClient();
      const { tokens } = await client.getToken(code);
      if (!tokens.access_token) throw new Error("Google did not return an access token");
      client.setCredentials(tokens);
      const profile = await google.gmail({ version: "v1", auth: client }).users.getProfile({ userId: "me" });
      db.prepare(`
        INSERT INTO integration_connections (user_id, provider, account_email, encrypted_access_token, encrypted_refresh_token, scopes)
        VALUES (?, 'gmail', ?, ?, ?, ?)
        ON CONFLICT(user_id, provider) DO UPDATE SET account_email = excluded.account_email,
          encrypted_access_token = excluded.encrypted_access_token, encrypted_refresh_token = excluded.encrypted_refresh_token,
          scopes = excluded.scopes, status = 'Connected'
      `).run(userId, profile.data.emailAddress ?? null, encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, (tokens.scope ?? "").toString());
      return res.redirect(`${process.env.CLIENT_URL ?? "http://localhost:5173"}?integration=gmail-connected`);
    } catch {
      return res.redirect(`${process.env.CLIENT_URL ?? "http://localhost:5173"}?integration=gmail-error`);
    }
  });
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
    return res.status(400).json({ error: "Name, email, and a password of at least 8 characters are required" });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name.trim(), email.trim().toLowerCase(), passwordHash);
    const token = jwt.sign({ userId: result.lastInsertRowid }, jwtSecret, { expiresIn: "7d" });
    return res.status(201).json({ token, user: { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase() } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return res.status(409).json({ error: "An account with that email already exists" });
    return res.status(500).json({ error: "Could not create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const user = email ? db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as { id: number; name: string; email: string; password_hash: string } | undefined : undefined;
  if (!user || !password || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect" });
  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get("/api/me", auth, (req: AuthRequest, res) => {
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.userId);
  return user ? res.json({ user }) : res.status(404).json({ error: "User not found" });
});

app.get("/api/applications", auth, (req: AuthRequest, res) => {
  return res.json(db.prepare("SELECT id, company, role, location, status, logo, tone, updated FROM applications WHERE user_id = ? ORDER BY id DESC").all(req.userId));
});

app.post("/api/applications", auth, (req: AuthRequest, res) => {
  const { company, role, location = "Location not added", status = "Saved", logo = company?.slice(0, 1).toUpperCase(), tone = "purple" } = req.body;
  if (!company?.trim() || !role?.trim()) return res.status(400).json({ error: "Company and role are required" });
  const result = db.prepare("INSERT INTO applications (user_id, company, role, location, status, logo, tone, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(req.userId, company.trim(), role.trim(), location.trim(), status, logo, tone, "Added just now");
  return res.status(201).json(db.prepare("SELECT id, company, role, location, status, logo, tone, updated FROM applications WHERE id = ?").get(result.lastInsertRowid));
});

app.patch("/api/applications/:id", auth, (req: AuthRequest, res) => {
  const { status } = req.body;
  const result = db.prepare("UPDATE applications SET status = ?, updated = 'Updated just now' WHERE id = ? AND user_id = ?").run(status, req.params.id, req.userId);
  return result.changes ? res.json({ ok: true }) : res.status(404).json({ error: "Application not found" });
});

app.get("/api/tasks", auth, (req: AuthRequest, res) => {
  return res.json(db.prepare("SELECT id, title, meta, priority, done FROM tasks WHERE user_id = ? ORDER BY done ASC, id DESC").all(req.userId));
});

app.post("/api/tasks", auth, (req: AuthRequest, res) => {
  const { title, meta = "Today · Added manually", priority = "Medium" } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Task title is required" });
  const result = db.prepare("INSERT INTO tasks (user_id, title, meta, priority) VALUES (?, ?, ?, ?)").run(req.userId, title.trim(), meta, priority);
  return res.status(201).json(db.prepare("SELECT id, title, meta, priority, done FROM tasks WHERE id = ?").get(result.lastInsertRowid));
});

app.patch("/api/tasks/:id", auth, (req: AuthRequest, res) => {
  const result = db.prepare("UPDATE tasks SET done = ? WHERE id = ? AND user_id = ?").run(req.body.done ? 1 : 0, req.params.id, req.userId);
  return result.changes ? res.json({ ok: true }) : res.status(404).json({ error: "Task not found" });
});

function classifyMessage(subject: string, body: string) {
  const text = `${subject} ${body}`.toLowerCase();
  if (/(interview|schedule.*call|meet with us)/.test(text)) return { type: "Interview invitation", confidence: 0.95 };
  if (/(offer|pleased to offer|congratulations)/.test(text)) return { type: "Offer", confidence: 0.93 };
  if (/(unfortunately|rejection|not moving forward)/.test(text)) return { type: "Rejection", confidence: 0.94 };
  if (/(application.*received|thank you for applying|application submitted)/.test(text)) return { type: "Application confirmation", confidence: 0.91 };
  if (/(job alert|new opening|we are hiring|vacancy|role at)/.test(text)) return { type: "Job alert", confidence: 0.78 };
  if (/(recruiter|talent acquisition|hiring manager)/.test(text)) return { type: "Recruiter message", confidence: 0.75 };
  return { type: "Other", confidence: 0.2 };
}

function extractOpportunity(subject: string, body: string) {
  const text = `${subject}\n${body}`;
  const company = text.match(/(?:at|from|with)\s+([A-Z][A-Za-z0-9&.' -]{2,40})/i)?.[1]?.trim();
  const role = text.match(/(?:role|position|job title|application for)[:\s]+([A-Za-z][A-Za-z0-9 /&-]{2,60})/i)?.[1]?.trim();
  return { company: company?.replace(/[.,]$/, ""), role: role?.replace(/[.,]$/, "") };
}

app.post("/api/source-messages/ingest", auth, (req: AuthRequest, res) => {
  const { provider = "Manual import", externalId, sender, subject, body, receivedAt = new Date().toISOString() } = req.body as {
    provider?: string; externalId?: string; sender?: string; subject?: string; body?: string; receivedAt?: string;
  };
  if (!externalId?.trim() || !sender?.trim() || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "External ID, sender, subject, and body are required" });
  }
  const classification = classifyMessage(subject, body);
  const opportunity = extractOpportunity(subject, body);
  try {
    const result = db.prepare(`
      INSERT INTO source_messages (user_id, provider, external_id, sender, subject, body, received_at, message_type, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, provider.trim(), externalId.trim(), sender.trim(), subject.trim(), body.trim(), receivedAt, classification.type, classification.confidence);
    return res.status(201).json({
      id: result.lastInsertRowid,
      provider, externalId, sender, subject, receivedAt,
      messageType: classification.type, confidence: classification.confidence,
      opportunity, status: "Pending",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return res.status(409).json({ error: "This source message was already imported" });
    return res.status(500).json({ error: "Could not import source message" });
  }
});

app.get("/api/source-messages", auth, (req: AuthRequest, res) => {
  return res.json(db.prepare(`
    SELECT id, provider, external_id AS externalId, sender, subject, body, received_at AS receivedAt,
      message_type AS messageType, confidence, status
    FROM source_messages WHERE user_id = ? ORDER BY id DESC
  `).all(req.userId));
});

app.patch("/api/source-messages/:id", auth, (req: AuthRequest, res) => {
  const status = req.body.status;
  if (!["Approved", "Ignored", "Pending"].includes(status)) return res.status(400).json({ error: "Invalid review status" });
  const result = db.prepare("UPDATE source_messages SET status = ? WHERE id = ? AND user_id = ?").run(status, req.params.id, req.userId);
  return result.changes ? res.json({ ok: true }) : res.status(404).json({ error: "Source message not found" });
});

app.listen(port, () => console.log(`CareerLaunch API listening on http://localhost:${port}`));
