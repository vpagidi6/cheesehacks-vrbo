# AI Token Tracker

A Chrome extension that logs your token usage on ChatGPT, Claude, and Gemini and displays your estimated environmental impact from AI usage.

Built for hackathon use.

## Features

- **Automatic token tracking** when you use:
  - [ChatGPT](https://chatgpt.com)
  - [Claude](https://claude.ai)
  - [Gemini](https://gemini.google.com) / [AI Studio](https://aistudio.google.com)
- **Dashboard** showing total tokens, estimated CO₂, and equivalence (e.g., "miles driven")
- **Per-platform breakdown** (ChatGPT vs Claude vs Gemini)
- **Recent activity history**

## Installation

1. Clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the **`extension`** folder in this repo

## How It Works

The extension observes assistant messages on ChatGPT, Claude, and Gemini pages, estimates token counts from text length, and stores usage locally. When you’re logged in (via the popup), usage is also sent to your backend. The dashboard displays aggregated usage and estimates environmental impact.

## Environmental Impact Estimate

Estimates use:
- ~0.01 g CO₂ per token (based on LLM inference carbon studies)
- Equivalence to car miles driven (~400 g CO₂ per mile)
- Tree offset time (~21 kg CO₂ absorbed per tree per year)

## Project Structure

```
cheesehacks-vrbo/
├── extension/              # Chrome extension (load this folder in chrome://extensions)
│   ├── manifest.json       # Manifest V3
│   ├── content.js         # Observes LLM pages, estimates tokens, sends usage
│   ├── background.js      # Receives usage, stores locally, POSTs to backend when logged in
│   ├── dashboard/
│   │   ├── popup.html     # Popup UI (login, signup, dashboard)
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/
├── firebase-backend/       # Python (Flask) backend for auth + Firestore usage storage
├── BACKEND.md              # API contract for your backend
├── FIREBASE_SETUP.md       # Firebase project setup
└── README.md
```

## License

MIT
