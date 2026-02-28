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
5. Select the `cheesehacks-vrbo` folder

## How It Works

The extension injects a script into ChatGPT, Claude, and Gemini pages that intercepts `fetch` and `XMLHttpRequest` calls. When API responses include token usage (`prompt_tokens`, `completion_tokens`, etc.), the extension captures and stores that data. The dashboard displays aggregated usage and estimates environmental impact based on research (~10 mg CO₂ per token).

## Environmental Impact Estimate

Estimates use:
- ~0.01 g CO₂ per token (based on LLM inference carbon studies)
- Equivalence to car miles driven (~400 g CO₂ per mile)
- Tree offset time (~21 kg CO₂ absorbed per tree per year)

## Project Structure

```
cheesehacks-vrbo/
├── manifest.json      # Extension manifest (Manifest V3)
├── content.js         # Injects injector into LLM pages
├── injector.js        # Intercepts fetch/XHR, parses token usage
├── background.js      # Receives usage, stores in chrome.storage
└── dashboard/
    ├── popup.html     # Extension popup UI
    ├── popup.css      # Styles
    └── popup.js       # Loads data, renders dashboard
```

## License

MIT
