require("dotenv").config();

/**
 * sustAIn backend: auth + usage stored in Firebase Firestore.
 *
 * Set env vars:
 *   GOOGLE_APPLICATION_CREDENTIALS = path to Firebase service account JSON
 *   JWT_SECRET = any long random string (for signing tokens)
 *
 * Or create a .env file (not committed) with JWT_SECRET and put the
 * service account file at ./serviceAccountKey.json
 */

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production-use-env";
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin (use service account file or env)
if (!admin.apps.length) {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";
  try {
    const serviceAccount = require(path);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    console.error("Firebase init failed. Put serviceAccountKey.json in this folder or set GOOGLE_APPLICATION_CREDENTIALS.");
    process.exit(1);
  }
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

function getUsersByEmail(email) {
  return db.collection("users").where("email", "==", email).limit(1).get();
}

function createToken(userId, email) {
  return jwt.sign(
    { userId, email, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// POST /auth/register
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const snap = await getUsersByEmail(normalizedEmail);
    if (!snap.empty) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const ref = await db.collection("users").add({
      email: normalizedEmail,
      passwordHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const token = createToken(ref.id, normalizedEmail);
    return res.status(201).json({
      token,
      user: { email: normalizedEmail },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const snap = await getUsersByEmail(normalizedEmail);
    if (snap.empty) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const doc = snap.docs[0];
    const user = doc.data();
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = createToken(doc.id, normalizedEmail);
    return res.json({
      token,
      user: { email: normalizedEmail },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login failed" });
  }
});

// POST /usage (requires Bearer token)
app.post("/usage", authMiddleware, async (req, res) => {
  try {
    const { provider, model, inputTokens, outputTokens, totalTokens, timestamp, url } = req.body || {};
    const userId = req.userId;
    await db.collection("users").doc(userId).collection("usage").add({
      provider: provider || "unknown",
      model: model || "estimated",
      inputTokens: Number(inputTokens) || 0,
      outputTokens: Number(outputTokens) || 0,
      totalTokens: Number(totalTokens) || 0,
      timestamp: Number(timestamp) || Date.now(),
      url: url || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to save usage" });
  }
});

app.listen(PORT, () => {
  console.log("sustAIn backend running on port", PORT);
});
