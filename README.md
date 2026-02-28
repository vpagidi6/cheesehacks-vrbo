# WaterWise AI - Frontend

A sleek dashboard for monitoring AI water usage estimates, built for the WaterWise AI hackathon project.

## Stack
- Vite + React + TypeScript
- Wouter (Routing)
- Tailwind CSS

## Setup
1. Define your backend API URL. In development, it defaults to `http://localhost:8000`. You can set the `VITE_API_BASE` environment variable to override this.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev:client` (or `npm run dev` to start both if configured)

## Pages
- `/login` - Simple email-only login (stored in `localStorage`).
- `/dashboard` - Overview of water usage, progress towards daily limits, provider breakdown, and a monthly heatmap.
- `/settings` - Configure daily limit and estimation modes ("low", "conservative", "range").

## API Endpoints integrated
- `GET /api/summary?user=<email>&month=<YYYY-MM>`
- `POST /api/settings`
