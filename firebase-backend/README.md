# sustAIn Firebase Backend

This folder is a small Node.js backend that stores **users** and **usage** in Firebase Firestore. The sustAIn extension calls it for login, signup, and to send token usage.

## 1. Firebase setup

Do **Part 1** of the main repo’s **FIREBASE_SETUP.md** (create project, enable Email/Password, create Firestore, set rules). Then:

- In Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.
- Save the JSON file as **`serviceAccountKey.json`** in this folder (`firebase-backend/`).
- **Do not commit this file** (add it to `.gitignore`).

## 2. Install and run locally

```bash
cd firebase-backend
npm install
```

Set a secret for JWT signing (required in production):

```bash
export JWT_SECRET="your-long-random-secret"
node index.js
```

Or create a `.env` file (do not commit) with:

```
JWT_SECRET=your-long-random-secret
PORT=3000
```

Then run:

```bash
node index.js
```

The server listens on **http://localhost:3000**.

## 3. Point the extension at this backend

1. Open the sustAIn extension popup.
2. In **API URL** enter: `http://localhost:3000` (or your deployed URL).
3. Sign up or log in. Usage from the extension will be sent to `POST /usage` and stored in Firestore under `users/{userId}/usage`.

## 4. Firestore structure

- **`users`** (collection)  
  - Document ID: auto-generated.  
  - Fields: `email`, `passwordHash`, `createdAt`.

- **`users/{userId}/usage`** (subcollection)  
  - One document per usage event.  
  - Fields: `provider`, `model`, `inputTokens`, `outputTokens`, `totalTokens`, `timestamp`, `url`, `createdAt`.

Your dashboard can read `users/{userId}/usage` (or aggregate in a Cloud Function) to show token counts per account.

## 5. Deploy (optional)

- **Google Cloud Run**: build a Docker image from this folder (Dockerfile that runs `node index.js`), set `GOOGLE_APPLICATION_CREDENTIALS` or mount the service account key, set `JWT_SECRET`, and deploy. Use the Cloud Run URL as the extension’s API URL.
- **Firebase Cloud Functions**: you can refactor this into HTTP functions (e.g. `onRequest` for `/auth/register`, `/auth/login`, `/usage`) and deploy with `firebase deploy --only functions`. Use the function base URL as the extension’s API URL.
