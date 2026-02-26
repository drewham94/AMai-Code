import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("accent_master.db");

// Initialize database with user-specific columns
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    date TEXT,
    language TEXT,
    accent TEXT,
    skillLevel TEXT,
    flavor TEXT,
    mode TEXT,
    prompt TEXT,
    score REAL,
    assistantResponse TEXT,
    feedback TEXT
  );
  
  CREATE TABLE IF NOT EXISTS user_profile (
    email TEXT PRIMARY KEY,
    name TEXT,
    targetLanguage TEXT,
    targetAccent TEXT,
    skillLevel TEXT,
    preferredFlavor TEXT,
    dailyGoal INTEGER,
    preferredVoice TEXT,
    assistantLanguage TEXT,
    assistantEnglishAccent TEXT,
    isLiveAssistantEnabled INTEGER
  );

  CREATE TABLE IF NOT EXISTS saved_passages (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    text TEXT,
    date TEXT,
    language TEXT
  );

  CREATE TABLE IF NOT EXISTS slang_bank (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    term TEXT,
    meaning TEXT,
    example TEXT,
    region TEXT,
    language TEXT,
    dateLearned TEXT
  );
`);

// Migration: Add user_email to existing tables if missing
const tablesToMigrate = ['sessions', 'saved_passages', 'slang_bank'];
for (const table of tablesToMigrate) {
  try {
    db.prepare(`SELECT user_email FROM ${table} LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding user_email column to ${table} table...`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN user_email TEXT`);
  }
}

// Migration: Ensure all columns exist in user_profile
const profileColumns = [
  { name: 'preferredVoice', type: 'TEXT' },
  { name: 'assistantLanguage', type: 'TEXT' },
  { name: 'assistantEnglishAccent', type: 'TEXT' },
  { name: 'isLiveAssistantEnabled', type: 'INTEGER' }
];

for (const col of profileColumns) {
  try {
    db.prepare(`SELECT ${col.name} FROM user_profile LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding ${col.name} column to user_profile table...`);
    db.exec(`ALTER TABLE user_profile ADD COLUMN ${col.name} ${col.type}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: 'accent-master-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userEmail) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    req.session.userEmail = email;
    const profile = db.prepare("SELECT * FROM user_profile WHERE email = ?").get(email);
    
    if (profile) {
      profile.isLiveAssistantEnabled = !!profile.isLiveAssistantEnabled;
    }
    
    res.json({ success: true, profile: profile || null });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.session.userEmail) {
      return res.json(null);
    }
    const profile = db.prepare("SELECT * FROM user_profile WHERE email = ?").get(req.session.userEmail);
    if (profile) {
      profile.isLiveAssistantEnabled = !!profile.isLiveAssistantEnabled;
    }
    res.json(profile || { email: req.session.userEmail });
  });

  app.get("/api/profile", requireAuth, (req, res) => {
    const profile = db.prepare("SELECT * FROM user_profile WHERE email = ?").get(req.session.userEmail);
    if (profile) {
      profile.isLiveAssistantEnabled = !!profile.isLiveAssistantEnabled;
    }
    res.json(profile || null);
  });

  app.post("/api/profile", requireAuth, (req, res) => {
    const { 
      name, targetLanguage, targetAccent, skillLevel, preferredFlavor, 
      dailyGoal, preferredVoice, assistantLanguage, assistantEnglishAccent, isLiveAssistantEnabled 
    } = req.body;
    const email = req.session.userEmail;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_profile (
        email, name, targetLanguage, targetAccent, skillLevel, preferredFlavor, 
        dailyGoal, preferredVoice, assistantLanguage, assistantEnglishAccent, isLiveAssistantEnabled
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      email, name, targetLanguage, targetAccent, skillLevel, preferredFlavor, 
      dailyGoal, preferredVoice, assistantLanguage, assistantEnglishAccent, isLiveAssistantEnabled ? 1 : 0
    );
    res.json({ success: true });
  });

  app.get("/api/sessions", requireAuth, (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions WHERE user_email = ? ORDER BY date DESC").all(req.session.userEmail);
    const parsedSessions = sessions.map((s: any) => ({
      ...s,
      feedback: JSON.parse(s.feedback)
    }));
    res.json(parsedSessions);
  });

  app.post("/api/sessions", requireAuth, (req, res) => {
    const { id, date, language, accent, skillLevel, flavor, mode, prompt, score, feedback, assistantResponse } = req.body;
    const stmt = db.prepare(`
      INSERT INTO sessions (id, user_email, date, language, accent, skillLevel, flavor, mode, prompt, score, feedback, assistantResponse)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, req.session.userEmail, date, language, accent, skillLevel, flavor, mode, prompt, score, JSON.stringify(feedback), assistantResponse);
    res.json({ success: true });
  });

  app.get("/api/passages", requireAuth, (req, res) => {
    const passages = db.prepare("SELECT * FROM saved_passages WHERE user_email = ? ORDER BY date DESC").all(req.session.userEmail);
    res.json(passages);
  });

  app.post("/api/passages", requireAuth, (req, res) => {
    const { id, text, date, language } = req.body;
    const stmt = db.prepare("INSERT INTO saved_passages (id, user_email, text, date, language) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, req.session.userEmail, text, date, language);
    res.json({ success: true });
  });

  app.get("/api/slang", requireAuth, (req, res) => {
    const slang = db.prepare("SELECT * FROM slang_bank WHERE user_email = ? ORDER BY dateLearned DESC").all(req.session.userEmail);
    res.json(slang);
  });

  app.post("/api/slang", requireAuth, (req, res) => {
    const { id, term, meaning, example, region, language, dateLearned } = req.body;
    const stmt = db.prepare("INSERT INTO slang_bank (id, user_email, term, meaning, example, region, language, dateLearned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(id, req.session.userEmail, term, meaning, example, region, language, dateLearned);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
