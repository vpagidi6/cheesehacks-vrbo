# Firebase setup for the extension

## 1. Authentication

- **Firebase Console → Build → Authentication → Sign-in method** → turn on **Email/Password** and save.
- **Authentication → Settings → Authorized domains** → add your extension origin: `chrome-extension://YOUR_EXTENSION_ID` (find the ID in `chrome://extensions` when the extension is loaded).

## 2. Firestore rules

In **Firebase Console → Firestore Database → Rules**, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /usage_events/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Then click **Publish**. This ensures each user can only read/write their own `users/{uid}` doc and `usage_events` subcollection.

## 3. Where token data is written

- **`users/{userId}`** – Updated with `totalTokens` (number), `totalByProvider` (map, e.g. `chatgpt`, `claude`, `gemini`), and `updatedAt`. Created on signup with `email` and `createdAt`; token fields are added/updated when usage is synced.
- **`users/{userId}/usage_events`** – One document per usage event (provider, model, inputTokens, outputTokens, totalTokens, timestamp, url, createdAt).

Token data is **not** written from the background (service worker). It is written when you **open the extension popup** (or the stats page) while logged in. Usage is queued in the extension and synced to Firestore on that open. If token data never appears:

1. **Open the popup after using an LLM** – Use ChatGPT/Claude/Gemini, then click the extension icon so the popup opens and runs the sync.
2. **Check Firestore rules** – Rules must allow `read, write` for `users/{userId}` and `users/{userId}/usage_events/{eventId}` when `request.auth.uid == userId`. Publish the rules above if you haven’t.
3. **Check the console** – Right‑click the extension icon → “Inspect popup”. In the Console, look for `[sustAIn] Sync to Firestore failed:` to see permission or network errors.
