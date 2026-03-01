# sustAIn

Track LLM token usage and estimated environmental impact across ChatGPT, Claude, and Gemini.

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

## Prerequisites

- Node.js 18+
- npm
- Python 3.10+ (or compatible)
- Firebase project with Auth + Firestore enabled

## 1) Install dependencies

```bash
# Extension
cd extension && npm install

# Frontend
cd ../frontend && npm install

# Backend
cd ../firebase-backend && pip install -r requirements.txt
```

## 2) Firebase setup

- See `FIREBASE_SETUP.md` and `extension/FIREBASE_RULES.md`.
- Extension and frontend Firebase web config is currently in:
  - `extension/src/firebase-config.js`
  - `frontend/client/src/lib/firebase.ts`
- Backend credentials:
  - put `serviceAccountKey.json` in `firebase-backend/`, or
  - set `GOOGLE_APPLICATION_CREDENTIALS`.

## 3) Run each app

### Extension

```bash
cd extension
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select the `extension/` folder

### Frontend (web dashboard)

```bash
cd frontend
npm run dev
```

The app serves on port `5000` by default.

Optional environment variables used by client API:

- `VITE_API_BASE` (defaults to deployed Cloud Run URL in code)
- `VITE_USE_MOCK=true` to use mock data mode

### Flask backend

```bash
cd firebase-backend
python app.py
```

Local default: `http://localhost:3000`

More deployment details: `firebase-backend/README.md`

## Repo structure

```text
cheesehacks-vrbo/
├── extension/          # Chrome extension (Manifest V3)
├── frontend/           # Vite + React + TypeScript dashboard
├── firebase-backend/   # Flask read-only stats API
├── BACKEND.md          # Legacy backend contract notes
├── FIREBASE_SETUP.md   # Firebase setup guidance
└── README.md
```

## Notes

- Some docs in this repo are legacy/hackathon-era and may describe earlier flows.
- For current runtime behavior, rely on code in `extension/src/`, `frontend/client/src/`, and `firebase-backend/app.py`.

## License

MIT
