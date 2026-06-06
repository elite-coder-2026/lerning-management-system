# Raw PostgreSQL LMS

This project contains a Vite React frontend and a TypeScript Express backend for a learning management system.

The backend intentionally uses raw PostgreSQL through `pg` only:

```text
routes -> controllers -> services -> repositories -> pg Pool -> PostgreSQL
```

## Backend

```sh
cd server
npm install
cp .env.example .env
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
npm run dev
```

Repository files under `server/src/repositories` are the only place application SQL belongs. Transactional flows are implemented for enrollment, payment, quiz submission, and assignment grading.

## Frontend

```sh
cd client
npm install
npm run dev
```

Set `VITE_API_BASE_URL` if the API is not running at `http://localhost:4000`.
