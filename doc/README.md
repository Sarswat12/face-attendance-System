Face Recognition Attendance — Database schema and mapping

This folder contains the canonical MySQL schema the backend team should implement and follow. The frontend expects the database fields and relationships described here.

Files:
- `schema.sql` — MySQL CREATE TABLE script. Run this on your MySQL server (no Docker) to create the database and tables.

Important mappings (frontend → DB):
- User register/login
  - Frontend registers users via POST `/api/auth/register` with { name, email, password, role }
  - Store registered users in `users` table. `email` must be unique.
  - Passwords: store as secure hash (bcrypt/argon2). The column is `password_hash`.
  - Frontend reads `user_id`, `name`, `role`, `email`, `avatar`, `department`.

- Face enrollment
  - Frontend uploads images to `/api/face/enroll` as multipart form with field `image`.
  - Each successful enrollment should create a `faces` row with `user_id`, `face_id` (unique), `image_path`, and optional `metadata` (JSON).

- Attendance marking
  - Frontend posts to `/api/attendance/mark` and expects a record in `attendance` with `user_id` (if identified), `face_id`, `status`, and `timestamp`.
  - Frontend fetches `/api/attendance/records` and expects an array of records with fields: `id`, `userId`/`user_id`, `name`, `department`, `timestamp`, `status`.

- Tokens
  - The frontend stores a bearer token in `localStorage` and sends `Authorization: Bearer <token>` on requests.
  - For refresh/revocation, optionally use `refresh_tokens` table.

CORS & Security
- The frontend uses `credentials: 'include'` in `src/api.js`. If backend uses cookies, configure `Access-Control-Allow-Credentials: true` and allow the frontend origin in `Access-Control-Allow-Origin`.
- For JWT usage, sign tokens with a secure `JWT_SECRET_KEY` (set in backend `.env`).

Workflows for backend devs
1. Run MySQL and execute `schema.sql` to create DB and tables.
2. Implement Flask endpoints as described in `OPENAPI.yaml` in repo root.
3. Use `users` table for all user-related data and return fields expected in the frontend.
4. For images, store files on disk or object storage; save the path/URL in `faces.image_path`.

Notes
- This schema was designed after careful review of the frontend code in this repository and matches the fields referenced across components.
- If the backend team prefers different column names, update the frontend `src/api` client and the components that reference response shapes; otherwise follow this schema exactly.
