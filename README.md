# sustAIn

## By: Vamshi Pagidi, Obaid Khwaja, Benjamin Joseph, and Raza Rashid

sustAIn helps people understand the hidden environmental cost of everyday AI use. It tracks LLM activity across ChatGPT, Claude, Gemini, and AI Studio, then turns token usage into clear impact metrics like water usage and CO₂ equivalents so users can make smarter prompting decisions in real time and truly understand the impact of the tools they use everyday.

Built as a hackathon project, sustAIn combines a Chrome extension that uses DOM monitoring to calculate tokens, a live dashboard to display stats, and cloud-backed analytics to make AI sustainability visible, measurable, and actionable.

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

Supported Websites:

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

## Calculation logic (current implementation)

### Quick conversion cheat sheet

- **1 token = 0.5 mL water**
- **1000 tokens = 500 mL = ~1 standard water bottle**
- **1 token = 0.01 g CO₂**
- **1000 tokens = 10 g CO₂**

### How the app computes impact

We estimate water and carbon emissions based on token usage using methodologies grounded in recent research on AI energy and water consumption. Specifically, we reference the findings from "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference" (arXiv:2505.09598v1), which provides an infrastructure-level framework for associating inference workload with energy and cooling water use.

Using this approach, we derive the following conversion formulas:

- **Frontend water shown in dashboard:**
  - `todayMl = round(totalTokens × 0.5)`
- **Backend water shown in API response:**
  - `totalWater_liters = totalTokens × 0.0005` (same conversion, different unit)
- **Backend CO₂ shown in API response:**
  - `totalCO2_grams = totalTokens × 0.01`
- **Default daily goal:**
  - `500 mL` (equivalent to ~`1000 tokens`)

### Real World Examples

- **500 tokens** → `250 mL` water → `~0.5 bottle` → `5 g CO₂`
- **5,400 tokens** → `2,700 mL` (`2.7 L`) water → `~5.4 bottles` → `54 g CO₂`
- **10,000 tokens** → `5,000 mL` (`5 L`) water → `~10 bottles` → `100 g CO₂`

CO₂ equivalence strings (feet/miles driven, days to offset) are derived from backend CO₂ totals.

## Quick start

🚀 [Open the live demo of dashboard](https://cheesehacks-vrbo.vercel.app/login)
- To test the extension:
  1. Clone the repo
  2. Navigate to chrome://extensions in the search bar of Chrome
  3. Turn on developer mode, click load unpacked, and upload the extension folder of the repo
  4. Create an account on the extension and scroll down on it after signing in
  5. Go to Claude, ChatGPT, or Gemini's website and hit Ctrl-Shift-R (Windows) or Cmd-Shift-R (Mac)
  6. Start prompting and watch the tokens be tracked!
