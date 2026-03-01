"""
Read-only backend: pulls usage stats from Firestore, computes CO2, water,
and equivalence stats, and returns enriched data for the frontend.

Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON,
or place serviceAccountKey.json in this folder.

Run: python app.py
GET /users/<uid>/stats  returns totalTokens, totalByProvider, and computed stats
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

# Matches extension constants
GRAM_CO2_PER_TOKEN = 0.01
GRAM_CO2_PER_MILE_DRIVING = 400
GRAM_CO2_PER_TREE_YEAR = 21000
LITER_WATER_PER_TOKEN = 0.0005  # ~0.5 L per 1000 tokens (cooling + electricity)

# Use service account key file if present; otherwise Application Default Credentials (GCP Compute Engine, Cloud Run)
if Path(cred_path).exists():
    cred = credentials.Certificate(cred_path)
else:
    cred = credentials.ApplicationDefault()
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


def _format_co2(grams):
    """Format CO2 in g or kg."""
    if grams < 1000:
        return f"{int(round(grams))} g"
    return f"{grams / 1000:.2f} kg"


def _get_equivalence(grams_co2):
    """Human-readable CO2 equivalence (matches extension logic)."""
    if grams_co2 < 1:
        return "—"
    miles = grams_co2 / GRAM_CO2_PER_MILE_DRIVING
    if miles < 0.01:
        return "~10 m driven"
    if miles < 1:
        return f"~{miles * 5280:.0f} ft driven"
    if miles < 10:
        return f"~{miles:.1f} mi driven"
    tree_years = grams_co2 / GRAM_CO2_PER_TREE_YEAR
    if tree_years >= 0.01:
        return f"~{tree_years * 365:.0f} days to offset"
    return f"~{miles:.1f} mi driven"


def _format_water(liters):
    """Format water in L or mL."""
    if liters < 0.001:
        return f"{liters * 1000:.1f} mL"
    if liters < 1:
        return f"{liters * 1000:.0f} mL"
    return f"{liters:.2f} L"


def _compute_stats(total_tokens):
    """Compute CO2, water, and equivalence from token count."""
    total_tokens = total_tokens or 0
    total_co2_grams = total_tokens * GRAM_CO2_PER_TOKEN
    total_water_liters = total_tokens * LITER_WATER_PER_TOKEN
    return {
        "totalCO2_grams": round(total_co2_grams, 2),
        "totalCO2_formatted": _format_co2(total_co2_grams),
        "totalWater_liters": round(total_water_liters, 6),
        "totalWater_formatted": _format_water(total_water_liters),
        "equivalence": _get_equivalence(total_co2_grams),
    }


@app.route("/users/<uid>/stats")
def get_user_stats(uid):
    """Read totalTokens and totalByProvider from DB; compute and return stats."""
    try:
        user_ref = db.collection("users").document(uid)
        user_snap = user_ref.get()

        totals = {"totalTokens": 0, "totalByProvider": {}}
        if user_snap.exists():
            totals = user_snap.to_dict()

        total_tokens = totals.get("totalTokens", 0) or 0
        total_by_provider = totals.get("totalByProvider", {}) or {}

        stats = _compute_stats(total_tokens)

        out = {
            "totalTokens": total_tokens,
            "totalByProvider": total_by_provider,
            "updatedAt": totals.get("updatedAt"),
            "totalCO2_grams": stats["totalCO2_grams"],
            "totalCO2_formatted": stats["totalCO2_formatted"],
            "totalWater_liters": stats["totalWater_liters"],
            "totalWater_formatted": stats["totalWater_formatted"],
            "equivalence": stats["equivalence"],
        }
        return jsonify(_to_json_safe(out))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
