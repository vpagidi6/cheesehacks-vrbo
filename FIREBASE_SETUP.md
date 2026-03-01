# Firebase setup (current architecture)

This project uses Firebase in two places:

- `extension/`: user auth + writing aggregate token totals to Firestore.
- `frontend/` + `firebase-backend/`: frontend gets Firebase ID token and calls backend `GET /users/me/stats`; backend verifies token and reads Firestore totals.

## 1) Create Firebase project

1. In Firebase Console, create a project.
2. Enable **Authentication → Email/Password** provider.
3. Create a **Firestore** database.
4. In **Project settings → Service accounts**, generate a private key JSON for backend/admin use.

## 2) Configure web app credentials

Current code includes Firebase web config directly in:

- `extension/src/firebase-config.js`
- `frontend/client/src/lib/firebase.ts`

If you use a different Firebase project, update both files with the same project credentials.

## 3) Firestore data model used by code

The extension updates aggregate fields in one user document:

- `users/{uid}`
  - `email` (created on signup)
  - `createdAt`
  - `totalTokens` (number)
  - `totalByProvider` (map, e.g. `chatgpt`, `claude`, `gemini`)
  - `updatedAt`

The extension currently **does not** persist one document per usage event to Firestore. Usage events are queued in Chrome local storage and merged into aggregate counters.

## 4) Firestore security rules

Use rules aligned with aggregate writes to `users/{uid}`:

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

Publish these rules after updating.

## 5) Backend credentials (firebase-backend)

For `firebase-backend/app.py`, either:

- place `serviceAccountKey.json` inside `firebase-backend/`, or
- set `GOOGLE_APPLICATION_CREDENTIALS` to the key file path.

The backend will verify Firebase ID tokens and read `users/{uid}` totals.

## 6) End-to-end flow

1. User signs in with Firebase from extension or frontend.
2. Extension captures usage, stores pending events in Chrome local storage.
3. On popup/stats open while authenticated, extension increments aggregate counters in `users/{uid}`.
4. Frontend sends `Authorization: Bearer <firebase-id-token>` to backend `GET /users/me/stats`.
5. Backend computes and returns CO2/water/equivalence from `users/{uid}.totalTokens`.

## 7) Notes

- `BACKEND.md` describes a legacy API contract (`/auth/*`, `/usage`) used in an earlier architecture.
- Current frontend integration uses only `GET /users/me/stats` from `firebase-backend`.
