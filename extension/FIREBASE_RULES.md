# Firebase setup for the extension (current behavior)

## 1) Authentication

- Firebase Console → Build → Authentication → Sign-in method → enable Email/Password.
- If needed, add your extension origin in Authentication authorized domains.

## 2) Firestore rules

In Firebase Console → Firestore Database → Rules, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Publish rules after saving.

## 3) Where token data is written

Current extension code writes only to:

- `users/{userId}`
  - `totalTokens`
  - `totalByProvider.<provider>`
  - `updatedAt`

It does not currently create per-event Firestore docs such as `usage_events`.

## 4) Sync timing

- Content scripts push events to `chrome.storage.local.pendingFirestore`.
- Firestore sync happens when popup or stats page code runs while user is authenticated.
- If you never open popup/stats after activity, queued events remain local.

## 5) If data is not appearing

1. Open popup or stats page after using ChatGPT/Claude/Gemini.
2. Confirm Firestore rules allow read/write on `users/{uid}`.
3. Inspect extension popup console for errors (`[sustAIn] Sync to Firestore failed:`).
