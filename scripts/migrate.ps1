<#
.SYNOPSIS
  PowerShell helper for Alembic/Flask-Migrate commands on Windows.

USAGE
  ./scripts/migrate.ps1 init
  ./scripts/migrate.ps1 migrate -Message "remove student role"
  ./scripts/migrate.ps1 upgrade

#>
param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet('init','migrate','upgrade','downgrade')]
    [string]$Action,
    [string]$Message = ''
)

Write-Host "Running migration helper: action=$Action" -ForegroundColor Cyan

# Activate venv if present
if (Test-Path .venv\Scripts\Activate.ps1) {
    Write-Host "Activating virtualenv .venv" -ForegroundColor Green
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "No .venv found — assuming environment already activated" -ForegroundColor Yellow
}

# Ensure FLASK_APP is set to top-level manage module
$env:FLASK_APP = 'manage'

switch ($Action) {
    'init' {
        Write-Host 'Initialising migrations (flask db init)' -ForegroundColor Green
        flask db init
    }
    'migrate' {
        if (-not $Message) { Write-Host 'Please provide -Message for migrate'; exit 1 }
        Write-Host "Creating migration with message: $Message" -ForegroundColor Green
        flask db migrate -m $Message
    }
    'upgrade' {
        Write-Host 'Applying migrations (flask db upgrade)' -ForegroundColor Green
        flask db upgrade
    }
    'downgrade' {
        Write-Host 'Downgrading (flask db downgrade)' -ForegroundColor Green
        flask db downgrade
    }
}

Write-Host "Done. REMEMBER: BACKUP your database before applying migrations." -ForegroundColor Yellow
