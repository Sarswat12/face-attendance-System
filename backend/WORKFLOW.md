Backend Implementation Workflow — Face Recognition Attendance System

This `WORKFLOW.md` gives a step-by-step ordered plan your backend team should follow to implement the entire backend in Flask + MySQL (no Docker). Implement tasks in the order below; each task includes acceptance criteria and recommended endpoints.

Prerequisites
- MySQL server available (user, password, database access)
- Python 3.10+ installed
- Frontend repo (this workspace) available to run locally at http://localhost:3000
- `OPENAPI.yaml` at repo root (use as contract)
- `doc/schema.sql` has the database schema; run it to create tables

Quick start (dev machine)
1. Create Python venv and install dependencies
   - python -m venv .venv
   - .\.venv\Scripts\Activate.ps1
   - pip install -r requirements.txt
2. Copy `.env.example` to `.env` and set DB credentials and `JWT_SECRET_KEY`.
    - IMPORTANT: Do not use the default `JWT_SECRET_KEY` in production. Use
       a long random value (eg. `python -c "import secrets; print(secrets.token_urlsafe(48))"`) and keep it secret.
3. Run schema SQL: `mysql -u <user> -p < doc\schema.sql`

Ordered implementation plan (high level)
1. Project setup & environment (0.5 day)
   - Initialize repo branch `backend/initial`.
   - Implement `Flask` app factory (`app.py`) and config via `.env`.
   - Ensure CORS configuration allows frontend origin and supports credentials if needed.
   - Acceptance: `GET /health` returns 200 and app connects to DB.

2. Authentication (1-2 days)
   - Implement registration (`POST /api/auth/register`): validate request, hash password (bcrypt), create user row, return JWT token and user data.
   - Implement login (`POST /api/auth/login`): verify password, return JWT token and user data.
   - Implement token verification (`GET /api/auth/verify-token`) to check token and return `{ valid, user_id, name, role }`.
   - Implement token issuing using `Flask-JWT-Extended` and optionally refresh tokens stored in `refresh_tokens` table.
      - Implement token issuing using `Flask-JWT-Extended` and optionally refresh tokens stored in `refresh_tokens` table. The repository now includes a basic refresh-token implementation (issue/refresh/revoke) which stores opaque refresh tokens in the DB. Consider using HttpOnly cookies for refresh tokens in production and rotate tokens on use.
    - Acceptance:
       - Frontend `LoginPage` and `Register` flows receive response `{ token, user_id, name, role }`.
       - `Authorization: Bearer <token>` works for protected endpoints.
      - The codebase supports cookie-based refresh tokens:
         - Refresh tokens may be stored in an HttpOnly cookie (default name `refresh_token`).
         - The `/api/auth/refresh` endpoint performs rotation-on-use (old token revoked, new token issued and set as cookie).
         - To enable secure cookie behavior in production, set `REFRESH_COOKIE_SECURE=true` and run over HTTPS.

3. Users CRUD and listing (1 day)
   - GET `/api/users` (support `?role=` filter) — return `{ users: [...] }`.
   - GET `/api/users/{id}` — return single user object.
   - POST `/api/users` — create user (admin-only).
   - PUT `/api/users/{id}` — update user profile (admin or owner where applicable).
   - DELETE `/api/users/{id}` — delete or mark inactive.
   - Acceptance:
     - `AdminUserManagement` must be able to fetch and display users.
     - Ensure response fields match frontend expectations: `id`, `name`, `email`, `role`, `department`, `avatar`, `status`, `joinDate`, `address`.

4. Face enrollment & storage (1-2 days)
   - POST `/api/face/enroll` — accept multipart form `image` and `user_id` (or auth token to infer user), store file on disk or object storage (S3), save `faces` row with `face_id` (UUID), `image_path`, `metadata` (if any).
         - NOTE: Current recognition in this repo uses a sha256 fingerprint stored in `faces.meta` as a prototype. For production you should compute and store face embeddings and perform matching using an approximate nearest neighbours index (FAISS, Annoy, etc.).
   - Store images under a consistent directory structure (e.g., `/uploads/faces/<user_id>/<filename>`).
   - Return `{ success: true, face_id }`.
   - Acceptance:
     - `RegisterFace` submit flow (which sends one request per file) returns success for each image.
     - `faces` table rows are created and accessible.

5. Attendance marking & records (2 days)
   - POST `/api/attendance/mark` — accept multipart `image` or JSON `{ face_id }`. If image, run recognition (or stub) to find `face_id` and `user_id`, then create attendance record.
   - GET `/api/attendance/today` — return today's record for the current user or general summary.
   - GET `/api/attendance/records` — return list for table with filters (date, userId, pagination).
   - Optionally implement `/api/attendance/export` for CSV/PDF.
   - Acceptance:
     - `AttendancePage` Start Recognition triggers POST and receives a record; table endpoint returns records array.

6. Dashboard / statistics endpoints (1 day)
   - GET `/api/statistics/dashboard` — return counts and summaries used on frontend.
   - Implement weekly and department breakdowns if required by AdminDashboard components.
   - Acceptance: admin pages display charts using real API data.

7. File serving & static assets (0.5 day)
   - Serve uploaded avatars/faces over HTTP (with secure, unguessable names or via signed URLs if storing externally).
   - Ensure `image_path` values are absolute URLs or frontend can fetch them.

8. Error handling, validation & logging (1 day)
   - Standardize error format: `{ error: 'message' }` or `{ message: '...' }` and return appropriate status codes.
   - Validate all inputs (email format, file type/size, role values).
   - Add server-side logging and optional request tracing.

9. Security review (0.5 day)
   - Enforce HTTPS in production, strong JWT secrets, rate limiting on auth endpoints, and sanitize file uploads.
   - Verify CORS and credentials settings match frontend usage.

10. Testing (1-2 days)
   - Unit tests for auth, users, attendance, face endpoints.
   - Integration tests: start server locally, point frontend `VITE_API_BASE` at backend, and run manual flows.
   - Provide Postman collection (from `OPENAPI.yaml`) for QA.

11. Migrations & production deployment (1 day)
   - Add `Flask-Migrate` or `Alembic` to manage schema changes.
   - Prepare production configuration and deployment steps (systemd, service, or cloud VM).

12. Handover & docs (0.5 day)
   - Commit implemented endpoints and update `OPENAPI.yaml` if shapes differ.
   - Provide SQL seeding script with at least one admin user.
   - Provide instructions in `backend/README.md` and add Postman collection in `doc/`.

Detailed acceptance criteria (for each endpoint)
- Auth endpoints return JSON in the exact shape frontend expects (see `OPENAPI.yaml`).
- `GET /api/users` returns `{ users: [...] }` with user objects fields matching frontend.
- `POST /api/face/enroll` accepts `multipart/form-data` field `image` and returns `{ success: true, face_id }`.
- `GET /api/attendance/records` returns `{ records: [...] }`.

Checklist the team must sign off on (tick items when done)
- [ ] DB schema created from `doc/schema.sql` on dev server
- [ ] Auth implemented (login/register/verify-token)
- [ ] Users CRUD implemented and tested
- [ ] Face enroll endpoint implemented and images stored
- [ ] Attendance mark and records endpoints implemented and tested
- [ ] Dashboard stats endpoints implemented
- [ ] Error formats standardized and documented
- [ ] Postman collection added to `doc/` and tested
- [ ] Migrations added and initial migration created
- [ ] Production deployment checklist completed

Notes & tips
- Use `OPENAPI.yaml` as your contract. If you need to change a response shape, update both OpenAPI and frontend `api` usage.
- The frontend currently uploads one image per request during face enrollment. You may change to multi-file uploads but coordinate with frontend team.
- For recognition itself (model), start with a stub that returns a `face_id`, then integrate the real model later.

If you want, I can now:
- (A) Generate a Postman collection JSON from `OPENAPI.yaml` and place it in `doc/`.
- (B) Implement a minimal mock backend (Flask) that returns sample data for all endpoints so frontend devs can integrate immediately.
- (C) Create initial migration using Flask-Migrate and add migration scripts.

Choose A, B, or C (or multiple) and I will proceed.