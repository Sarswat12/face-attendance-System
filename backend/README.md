Backend README
==============

Quick start (development)

1. Create and activate Python virtualenv:

```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r backend\requirements.txt
```

3. Copy env example and edit credentials (optional):

```powershell
Copy-Item backend\.env.example backend\.env -ErrorAction SilentlyContinue
# Edit backend\.env to set DB_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD
```

4. Apply DB schema and seed admin:

```powershell
python backend\scripts\apply_schema.py
python backend\scripts\seed_admin.py
```

5. Start server:

```powershell
Set-Location backend
python app.py
```

Notes
- `/api/face/enroll` stores a SHA256 fingerprint of the image in the `meta` column to allow simple recognition.
- `/api/attendance/mark` attempts a hash-match when an image is provided.

## Database configuration (production safety)

- The app now requires a MySQL database in production. Environment variables:
	- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
	- `SQLALCHEMY_DATABASE_URI` may be set to override the above.
	- `DEV_FALLBACK_SQLITE`: set to `1`, `true`, or `yes` to allow SQLite fallback in development only.
	- `USE_SQLITE` and `USE_SQLITE_FILE` will only be honored when `DEV_FALLBACK_SQLITE` is set.
	- Pooling options via env:
		- `DB_POOL_SIZE` (default 10)
		- `DB_MAX_OVERFLOW` (default 20)
		- `DB_POOL_RECYCLE` (default 1800)
		- `DB_POOL_TIMEOUT` (default 30)

On startup the app logs a masked DB URI and the engine options. In production the app fails fast with a clear RuntimeError if MySQL is not configured or reachable (unless `DEV_FALLBACK_SQLITE` is explicitly enabled).

Migrations (safe commands)
- Windows PowerShell (from repo root):
	```powershell
	# create a migration
	./scripts/migrate.ps1 migrate -Message "initial"
	# apply migrations
	./scripts/migrate.ps1 upgrade
	```

- Unix / macOS (bash):
	```bash
	# ensure FLASK_APP points to manage.py and run migrate
	FLASK_APP=manage.py flask db migrate -m "initial"
	FLASK_APP=manage.py flask db upgrade
	```
