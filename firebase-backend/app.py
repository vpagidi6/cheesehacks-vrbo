"""
Read-only backend: returns usage stats for a specified account from Firestore.

Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON,
or place serviceAccountKey.json in this folder.

Run: python app.py
GET /users/<uid>/stats  returns totalTokens and totalByProvider
"""

import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

PORT = int(os.environ.get("PORT", "3000"))
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

if not Path(cred_path).exists():
    raise SystemExit(
        "Firebase init failed. Put serviceAccountKey.json in this folder "
        "or set GOOGLE_APPLICATION_CREDENTIALS."
    )

cred = credentials.Certificate(cred_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__)
CORS(app)


def _to_json_safe(obj):
    """Convert Firestore timestamps and similar to JSON-serializable types."""
    if hasattr(obj, "isoformat") and callable(obj.isoformat):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_json_safe(v) for v in obj]
    return obj


@app.route("/users/<uid>/stats")
def get_user_stats(uid):
    """Read totalTokens and totalByProvider for user."""
    try:
        user_ref = db.collection("users").document(uid)
        user_snap = user_ref.get()

        totals = {"totalTokens": 0, "totalByProvider": {}}
        if user_snap.exists():
            totals = user_snap.to_dict()

        out = {
            "totalTokens": totals.get("totalTokens", 0),
            "totalByProvider": totals.get("totalByProvider", {}),
            "updatedAt": totals.get("updatedAt"),
        }
        return jsonify(_to_json_safe(out))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
