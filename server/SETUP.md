Quick start (development with Docker)

1) Copy environment file

   cp .env.example .env
   (แก้ค่า SECRET_KEY ถ้าต้องการ)

2) Build & start services

   docker-compose up --build -d

3) Create database migrations and apply

   docker-compose exec web flask db init || true
   docker-compose exec web flask db migrate -m "init"
   docker-compose exec web flask db upgrade

4) Create admin user (Flask shell)

   docker-compose exec web flask shell

   >>> from app import db
   >>> from app.models import User
   >>> u = User(username='admin', is_admin=True)
   >>> u.set_password('admin')
   >>> db.session.add(u); db.session.commit()

5) Open browser

   http://localhost:5000  (login: admin / admin)

Windows — ติดตั้ง Docker อัตโนมัติ

- หากใช้ Windows: มีสคริปต์ช่วยติดตั้ง Docker Desktop + WSL2: `install_docker_windows.py`.
- รันจาก PowerShell (จะขอสิทธิ์ผู้ดูแลถ้าจำเป็น):

  ```powershell
  python install_docker_windows.py --yes --shim
  ```

- คำสั่งข้างต้นจะ: ติดตั้ง/ตั้งค่า WSL2 (ถ้ายังไม่มี), ติดตั้ง Docker Desktop (winget), และสร้าง `docker-compose` shim.

Frontend (removed)
- This repository no longer includes a separate Next.js/Tailwind frontend. The UI is served by Flask templates under `server/templates`. If you need a separate SPA, maintain it in a dedicated repository and point its API to `http://<server-ip>:5000`.

Notes
- DB: PostgreSQL service `db` in docker-compose; production-ready configuration and backups required before real use.
- CSV export is available for P&L. PDF export can be added later.
- To stop: docker-compose down
