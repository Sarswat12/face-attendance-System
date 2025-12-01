param(
    [string]$Action = 'migrate',
    [string]$Message = 'migration'
)

# Usage:
# ./backend/scripts/migrate.ps1 migrate -Message "initial"
# ./backend/scripts/migrate.ps1 upgrade

$Venv = Join-Path $PSScriptRoot "..\.venv\Scripts\Activate.ps1"
if (Test-Path $Venv) {
    & $Venv
} else {
    Write-Host "Virtualenv activate script not found: $Venv"
}

# Ensure we run from repo root
Set-Location $PSScriptRoot\..

# Ensure FLASK_APP points to the backend manage module
$env:FLASK_APP = 'backend.manage'
$env:FLASK_ENV = 'development'

# Path to venv python for running helper scripts reliably
$Python = Join-Path $PSScriptRoot "..\.venv\Scripts\python.exe"

switch ($Action.ToLower()) {
    'init' {
        & $Python -m flask --app backend.manage db init
        break
    }
    'migrate' {
        & $Python -m flask --app backend.manage db migrate -m "$Message"
        break
    }
    'upgrade' {
        # Prefer to run the programmatic upgrade helper. If required packages
        # (flask_migrate or alembic) are not installed in the venv, inform the
        # user and exit with a helpful message.
        $checkCmd = "import importlib,sys; importlib.import_module('flask_migrate') or importlib.import_module('alembic')"
        & $Python -c $checkCmd
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Required migration packages not found in the virtualenv."
            Write-Host "Run: .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt"
            exit 1
        }
        # Run the programmatic upgrade helper
        & $Python $PSScriptRoot\upgrade_db.py
        break
    }
    default {
        Write-Host "Unknown action: $Action"
    }
}
