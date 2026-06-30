# Deploying Omakase-Match

Frontend → **Vercel**, backend + PostgreSQL → **Railway**. Anonymous use only
(login + the mature-content gate are feature 002, not yet built).

This is a monorepo: the backend (NestJS) is in `backend/`, the frontend
(React/Vite) in `frontend/`. The production database starts **empty** — you run
the migration and the catalog ingestion **once, from your machine, pointed at
the Railway database**. (The ingestion is throttled to respect Jikan's rate
limit and takes ~30+ minutes; running it locally avoids needing dev tooling on
the server and a long-running server task.)

## 1. Railway — database + backend

1. Create a Railway project → **+ New** → **Database → PostgreSQL**.
2. **+ New → GitHub Repo** → select this repo. In the service **Settings**:
   - **Root Directory**: `backend`
   - **Build**: `npm install && npm run build` (the `postinstall` hook runs `prisma generate`)
   - **Start**: `npm run start`
3. Service **Variables**:
   - `DATABASE_URL` → reference the Postgres service's connection variable
   - `GEMINI_API_KEY` → your Gemini key
   - `GEMINI_MODEL` → `gemini-2.5-flash`
   - `NODE_ENV` → `production`
   - `CORS_ORIGIN` → (set in step 4, after the frontend URL exists)
4. Copy the backend's public URL (e.g. `https://<name>.up.railway.app`).

## 2. Populate the production database (once, from your machine)

Railway → Postgres service → **Connect** → copy the **public** connection
string, then run from `backend/`:

```bash
# Git Bash
DATABASE_URL="<railway-public-postgres-url>" npm run db:deploy        # create tables
DATABASE_URL="<railway-public-postgres-url>" npm run ingest:catalog   # import ~3000 titles (slow)
```

```powershell
# PowerShell
$env:DATABASE_URL="<railway-public-postgres-url>"; npm run db:deploy
$env:DATABASE_URL="<railway-public-postgres-url>"; npm run ingest:catalog
```

## 3. Vercel — frontend

1. Import this repo. **Root Directory**: `frontend`. Framework preset: **Vite**
   (build `npm run build`, output `dist`).
2. **Environment Variable**:
   - `VITE_API_BASE_URL` → your Railway backend URL from step 1.4
3. Deploy, then copy the Vercel URL.

## 4. Lock CORS

On Railway, set `CORS_ORIGIN` to your Vercel URL and redeploy the backend so the
API only accepts the deployed frontend.

## 5. Verify

- `GET <backend-url>/health` → `{"status":"ok"}`
- Open the Vercel URL → describe a taste → recommendations appear.

## Secrets

Never commit real values. `GEMINI_API_KEY` and `DATABASE_URL` live only in the
host's environment-variable settings (Railway/Vercel dashboards) and in the
local gitignored `backend/.env`.
