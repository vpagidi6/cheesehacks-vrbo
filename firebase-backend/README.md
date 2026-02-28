# sustAIn Firebase Backend

This folder contains a **Python (Flask)** backend that stores **users** and **usage** in Firebase Firestore. The sustAIn extension calls it for login, signup, and to send token usage.

## 1. Firebase setup

Do **Part 1** of the main repo’s **FIREBASE_SETUP.md** (create project, enable Email/Password, create Firestore, set rules). Then:

- In Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.
- Save the JSON file as **`serviceAccountKey.json`** in this folder (`firebase-backend/`).
- **Do not commit this file** (add it to `.gitignore`).

## 2. Install and run locally (Python)

```bash
cd firebase-backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set a secret for JWT signing (required in production). Either:

```bash
export JWT_SECRET="your-long-random-secret"
python app.py
```

Or create a `.env` file (do not commit) with:

```
JWT_SECRET=your-long-random-secret
PORT=3000
```

Then run:

```bash
python app.py
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
  - **Running totals** (updated on every `POST /usage`):  
    - `totalTokens` (number) – sum of all tokens for this user.  
    - `totalByProvider` (map) – e.g. `{ chatgpt: 1200, claude: 500, gemini: 300 }`.  
    - `updatedAt` (timestamp).

- **`users/{userId}/usage`** (subcollection)  
  - One document per usage event.  
  - Fields: `provider`, `model`, `inputTokens`, `outputTokens`, `totalTokens`, `timestamp`, `url`, `createdAt`.

Your frontend can read the **user document** (`users/{userId}`) to get `totalTokens` and `totalByProvider` without summing. Use `users/{userId}/usage` for per-event history.

## 5. Deploy (optional)

- **Google Cloud Run**: build a Docker image from this folder (Dockerfile that runs `python app.py` or `gunicorn app:app`), set `GOOGLE_APPLICATION_CREDENTIALS` or mount the service account key, set `JWT_SECRET`, and deploy. Use the Cloud Run URL as the extension’s API URL.
- **Firebase Cloud Functions**: you can refactor this into HTTP functions (e.g. `onRequest` for `/auth/register`, `/auth/login`, `/usage`) and deploy with `firebase deploy --only functions`. Use the function base URL as the extension’s API URL.
