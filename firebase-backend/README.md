# sustAIn read-only backend

Reads usage stats for a specified account from Firestore and returns them via REST.

## Local setup

1. Place `serviceAccountKey.json` (Firebase service account key) in this folder.
2. `pip install -r requirements.txt`
3. Run: `python app.py` (dev) or `gunicorn -b 0.0.0.0:${PORT:-3000} app:app` (production)

Server listens on **http://localhost:3000**.

## Deploy on GCP Compute Engine

1. **Create a VM**
   - Machine type: e2-micro or e2-small
   - Boot disk: Ubuntu 22.04
   - Allow HTTP/HTTPS traffic (for load balancer or direct access)

2. **Attach a service account** with Firestore Data Viewer (or Cloud Datastore User). Create one if needed and grant it access to your Firestore database.

3. **SSH into the VM** and run:

   ```bash
   sudo apt update && sudo apt install -y python3 python3-pip python3-venv
   git clone <your-repo> app && cd app/firebase-backend
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   export PORT=8080
   gunicorn -b 0.0.0.0:$PORT -w 1 app:app
   ```

4. **Run as a service** (optional): create `/etc/systemd/system/sustain-api.service`:

   ```ini
   [Unit]
   Description=sustAIn backend API
   After=network.target

   [Service]
   User=YOUR_USER
   WorkingDirectory=/path/to/firebase-backend
   Environment="PORT=8080"
   ExecStart=/path/to/firebase-backend/venv/bin/gunicorn -b 0.0.0.0:8080 -w 1 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Then: `sudo systemctl daemon-reload && sudo systemctl enable sustain-api && sudo systemctl start sustain-api`

On GCP, credentials come from the VM's attached service account (Application Default Credentials). No `serviceAccountKey.json` needed.

## API

### GET `/users/<uid>/stats`

Reads `totalTokens` and `totalByProvider` from Firestore, computes CO2, water, and equivalence stats, and returns enriched data for the frontend.

**Example:** `curl http://localhost:3000/users/abc123/stats`

**Response:**
```json
{
  "totalTokens": 1500,
  "totalByProvider": { "chatgpt": 800, "claude": 700 },
  "updatedAt": "2025-02-28T...",
  "totalCO2_grams": 15,
  "totalCO2_formatted": "15 g",
  "totalWater_liters": 0.75,
  "totalWater_formatted": "750 mL",
  "equivalence": "~0.04 mi driven"
}
```
