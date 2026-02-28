# Using Firebase to Track sustAIn Token Counts

You can use **Firebase** (Auth + Firestore) so each user has an account and their usage is stored in the cloud. The extension already has a login screen and sends usage to an API URL—you just need to point that URL at a small backend that talks to Firebase.

---

## Part 1: Create the Firebase project (one-time)

1. **Go to [Firebase Console](https://console.firebase.google.com/)** and sign in.

2. **Create a project**  
   - Click “Add project” → name it (e.g. `sustain-usage`) → follow the steps (Analytics optional).

3. **Enable Email/Password sign-in**  
   - In the left sidebar: **Build → Authentication**.  
   - Open the **Sign-in method** tab.  
   - Enable **Email/Password** (first provider in the list). Save.

4. **Create a Firestore database**  
   - **Build → Firestore Database** → **Create database**.  
   - Choose **Start in test mode** (you’ll lock it down with rules next).  
   - Pick a region and enable.

5. **Set Firestore security rules**  
   - In Firestore, open the **Rules** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: only the user can read their own doc (by uid)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Usage: only the user can read/write their own usage
    match /users/{userId}/usage/{usageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

   If your backend uses a **top-level `usage` collection** with a `userId` field instead of subcollections, use:

```javascript
match /usage/{usageId} {
  allow read, write: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
  allow read, write: if request.auth != null
    && resource.data.userId == request.auth.uid;
}
```

   Publish the rules.

6. **Get your config (for the backend)**  
   - **Project settings** (gear) → **Service accounts**.  
   - Click **Generate new private key** and save the JSON somewhere safe. Your backend will use this to talk to Firebase as Admin (Firestore + Auth if needed).

You don’t need to paste any Firebase config into the extension. The extension only needs your **backend API URL** (e.g. your Cloud Functions URL).

---

## Part 2: Backend that uses Firebase

The extension calls:

- `POST /auth/register` – create account  
- `POST /auth/login` – log in  
- `POST /usage` – send one usage event (with `Authorization: Bearer <token>`)

You need a small backend that:

1. **Register**: creates a user in Firebase Auth (or in Firestore with a hashed password) and returns a **token** (e.g. Firebase custom token or your own JWT) and `user: { email }`.
2. **Login**: checks email/password and returns the same kind of **token** and `user: { email }`.
3. **Usage**: verifies the **token**, gets the user id, then writes one document to Firestore for that user.

Two common options:

- **Option A – Firebase Auth + Firestore**: Backend uses **Firebase Admin SDK** to create users and sign in with email/password (via REST), then returns the Firebase **ID token** (or a custom token). Extension stores that token and sends it on `POST /usage`. Your backend verifies the ID token with Admin Auth and writes to Firestore (e.g. `users/{uid}/usage/{usageId}`).
- **Option B – Firestore-only users**: Backend stores users in a `users` collection (e.g. `email`, `passwordHash`), issues its own JWT on register/login, and on `POST /usage` verifies the JWT and writes to Firestore (e.g. `users/{userId}/usage` or a top-level `usage` collection with `userId`).

---

## Part 3: Firestore layout for token counts

Pick one shape and stick to it.

### Layout A: One subcollection per user (recommended)

- **Collection**: `users`  
  - **Document ID**: e.g. Firebase Auth `uid` or your own user id.  
  - **Fields**: `email`, `createdAt` (and `passwordHash` only if you’re not using Firebase Auth).

- **Subcollection**: `users/{userId}/usage`  
  - **Document ID**: auto-generated.  
  - **Fields**:  
    - `provider` (string): `"chatgpt"` | `"claude"` | `"gemini"`  
    - `model` (string)  
    - `inputTokens` (number)  
    - `outputTokens` (number)  
    - `totalTokens` (number)  
    - `timestamp` (number, e.g. milliseconds)  
    - `url` (string, optional)

Each usage event from the extension = one new document in `users/{userId}/usage`.  
To get **token counts per account**: for one `userId`, sum `totalTokens` over that user’s `usage` subcollection (and optionally group by `provider`).

### Layout B: Single `usage` collection

- **Collection**: `usage`  
  - **Document ID**: auto-generated.  
  - **Fields**: same as above, plus **`userId`** (string).

Same idea: one document per event. To get token counts per account, query `usage` where `userId == currentUser` and sum `totalTokens` (and optionally group by `provider`).

---

## Part 4: Connect the extension

1. Deploy your backend (Cloud Functions, Cloud Run, or any server) so it exposes:
   - `POST …/auth/register`
   - `POST …/auth/login`
   - `POST …/usage` (with `Authorization: Bearer <token>`)

2. In the extension popup, set **API URL** to your backend base URL (e.g. `https://us-central1-your-project.cloudfunctions.net/api` or `https://your-api.example.com`), then sign up or log in.

3. After login, the extension sends every new usage event to `POST …/usage`. Your backend verifies the token, gets the user id, and writes one document to Firestore as above.

---

## Part 5: Example backend (Node + Firebase Admin)

In the repo you’ll find a small **Node.js backend** in `firebase-backend/` that:

- Uses **Firebase Admin SDK** (service account key) to write to Firestore.
- Implements **register** and **login** with email + hashed password (stored in `users` in Firestore) and returns a **JWT**.
- Implements **POST /usage** by verifying the JWT and adding a document to `users/{userId}/usage`.

You can run it locally or deploy it to Cloud Run / Cloud Functions. Use its base URL as the **API URL** in the extension.

See `firebase-backend/README.md` for how to run and deploy it.
