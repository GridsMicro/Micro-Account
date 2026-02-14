MicroAccount frontend (Next.js + Tailwind)

Quick start (development):

1) Install dependencies

   cd frontend
   npm install

2) Run dev server

   npm run dev

The frontend listens on port 3000 by default. It expects the backend API at http://localhost:5000 (CORS is enabled in the Flask backend).

Docker (optional):

   docker compose up --build frontend

