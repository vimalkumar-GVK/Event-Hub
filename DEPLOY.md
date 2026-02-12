# Deployment Guide for Netlify

This project is configured for deployment on Netlify. It consists of a static frontend (HTML/CSS/JS) and a serverless Python backend (FastAPI via Netlify Functions).

## Quick Start

1.  **Install Netlify CLI** (Optional, for local testing):
    ```bash
    npm install netlify-cli -g
    ```

2.  **Deploy**:
    You can deploy by connecting your repository to Netlify used the web UI, or using the CLI:
    ```bash
    netlify deploy --prod
    ```

## Database Configuration (Crucial!)

By default, the application uses **SQLite**.
- **Local Development**: Uses `functions/test.db` (persisted on disk).
- **Netlify (Serverless)**: 
    - The filesystem is **read-only** in Lambda/Netlify Functions.
    - We have configured a fallback to use `/tmp/test.db` (ephemeral storage).
    - **WARNING**: Data stored in `/tmp` is **LOST** when the function instance is recycled (shortly after use).
    - **Demo Mode**: We replicate the `test.db` from your repo to `/tmp` on startup so the app is not empty (it will have the users/events you committed). But new registrations/events will NOT persist long-term.

### For Production Persistence
You **MUST** use an external database (PostgreSQL is recommended).

1.  Provision a database (e.g., Supabase, Neon, Render, or Railway).
2.  Get the Connection String (URI).
3.  Set the environment variable in Netlify:
    - Go to **Site Settings > Environment variables**.
    - Add Key: `DATABASE_URL`
    - Value: `postgresql://user:password@host:port/dbname` (Ensure it is `postgresql://` not `postgres://`).

## Local Development

To run the full stack locally:

```bash
# Install dependencies
pip install -r functions/requirements.txt

# Run the backend locally (using uvicorn)
uvicorn functions.main:app --reload
```

The frontend (`index.html`) can be opened directly or served via a simple HTTP server (`python -m http.server`).
Note: If running frontend separately, you may need to update `js/data.js` API_BASE if CORS is an issue, but standard `localhost` usually works fin if port matches.

## Security Notes
- `netlify.toml` handles redirects of `/api/*` to the Python function.
- It also blocks public access to `.db`, `.py`, `.env` and `functions/` folder for security.
