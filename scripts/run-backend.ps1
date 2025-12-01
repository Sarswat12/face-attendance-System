param(
    [switch]$UseSqlite = $true,
    [string]$BindHost = '127.0.0.1',
    [int]$BindPort = 8000
)

# Helper to start the backend from repo root. Activates .venv if present,
# sets PYTHONPATH and optional USE_SQLITE for quick dev, then runs `python manage.py`.
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repo = Split-Path -Parent $scriptDir
Push-Location $repo
try {
    $venv = Join-Path $repo '.venv\Scripts\Activate.ps1'
    if (Test-Path $venv) {
        & $venv
    }

    if ($UseSqlite) { $env:USE_SQLITE = '1' } else { Remove-Item Env:\USE_SQLITE -ErrorAction SilentlyContinue }
    # Ensure repo root is on PYTHONPATH so package imports work when running from repo root
    $env:PYTHONPATH = $repo

    Write-Host "Starting backend (USE_SQLITE=$UseSqlite) on ${BindHost}:${BindPort}..."
    python manage.py
}
finally {
    Pop-Location
}
