# sustAIn

sustAIn helps people understand the hidden environmental cost of everyday AI use. It tracks LLM activity across ChatGPT, Claude, Gemini, and AI Studio, then turns token usage into clear impact metrics like water usage and CO₂ equivalents so users can make smarter prompting decisions in real time.

Built as a hackathon project, sustAIn combines a Chrome extension, a live dashboard, and cloud-backed analytics to make AI sustainability visible, measurable, and actionable.

## Built on Google technologies (Hackathon highlight)

This project is built with **Firebase** and **Google Cloud Platform (GCP)**:

- **Firebase Authentication** for user sign-in.
- **Cloud Firestore** for per-user token aggregates and provider breakdown data.
- **Google Cloud Run (GCP)** for the deployed stats API used by the frontend (`/users/me/stats`).
- **Firebase Admin SDK** in the backend for token verification and Firestore access.

This repository now contains three parts:

- `extension/` — Chrome extension that captures usage and syncs totals to Firebase.
- `frontend/` — Vite + React + TypeScript dashboard app.
- `firebase-backend/` — Flask API that reads user stats from Firestore (`/users/me/stats`).

## What each part does

### 1) 🧩 Chrome extension (`extension/`)

- Injects content scripts on supported LLM sites.
- Estimates token usage from responses.
- Queues usage locally in `chrome.storage`.
- On popup auth state, syncs queued totals into Firestore `users/{uid}` aggregate fields.

Supported domains:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`
- `https://aistudio.google.com/*`

### 2) 📊 Web dashboard (`frontend/`)

- Firebase-authenticated React app.
- Fetches backend stats from `GET /users/me/stats` with Firebase ID token.
- Renders token/water/CO₂ summary and provider breakdown UI.
- Uses a GCP-hosted API endpoint (Cloud Run) by default.

### 3) ☁️ Read-only stats backend (`firebase-backend/`)

- Verifies Firebase ID token.
- Reads `users/{uid}` totals from Firestore.
- Returns computed `totalCO2`, `totalWater`, and equivalence fields.
- Intended for local dev and Cloud Run deployment on GCP.

## Quick start

🚀 [Open the live demo](https://cheesehacks-vrbo.vercel.app/login)
