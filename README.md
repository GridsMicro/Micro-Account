Micro Account — Run & Deploy (short)

Overview
- Backend: Flask app in `server/` (port 5000)
- Database: Postgres (container)
- Frontend: Next.js in `client/` (port 3000)

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
- If you want to run the client on a separate machine, expose port 3000 on the server host and set `NEXT_PUBLIC_API_URL` (or `API_URL`) to `http://<server-ip>:5000`.
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
