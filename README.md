Micro Account — Run & Deploy (short)

Overview
- Backend: Flask app in `server/` (port 5000) — serves server-side UI from `server/templates`
- Database: Postgres (container)
- Note: the separate Next.js `client/` frontend has been removed; use the built-in server UI (port 5000).

Quick start (recommended, from repo root)

1) Build and run with docker compose (compose will create the network):

```bash
docker compose up --build -d
```

2) Check containers and logs

```bash
docker compose ps
docker compose logs -f web
```

3) Health check

```bash
# from the host that can reach the server container
curl http://localhost:5000/health
```

Notes
- `docker-compose.yml` now creates an internal `sharednet` network (no external network required).
- This repository no longer includes a separate `client/` frontend; the UI is served by Flask from `server/templates` on port 5000.
- Do not use `FLASK_ENV=development` in production and keep `SECRET_KEY` secure.

Troubleshooting
- If DB migrations are needed:

```bash
cd server
flask db init   # only first time
flask db migrate
flask db upgrade
```




Contact
- Repo workspace: this folder
