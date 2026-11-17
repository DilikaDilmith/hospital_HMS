<#
.SYNOPSIS
    HMS Daily Database Backup Script (PowerShell)
.DESCRIPTION
    Safely exports MySQL database schema and records to a timestamped .sql file.
    No credentials are hardcoded; reads from environment variables.
#>

$ErrorActionPreference = "Stop"

$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "hms_db" }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupDir = Join-Path $scriptDir "backups\daily"
$logFile   = Join-Path $scriptDir "backups\backup.log"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp  = (Get-Date).ToString("yyyyMMdd_HHmmss")
$backupFile = Join-Path $backupDir "hms_daily_$timestamp.sql"

Write-Host "[$((Get-Date).ToString('u'))] Starting daily backup for database '$dbName'..."
Write-Host "Destination: $backupFile"

$dumpArgs = @(
    "-h", $dbHost,
    "-P", $dbPort,
    "-u", $dbUser,
    "--single-transaction",
    "--quick",
    "--routines",
    "--triggers",
    $dbName
)

if ($env:DB_PASSWORD) {
    $dumpArgs = @("--password=$($env:DB_PASSWORD)") + $dumpArgs
}

try {
    & mysqldump.exe $dumpArgs | Out-File -FilePath $backupFile -Encoding utf8
    $logMsg = "[$((Get-Date).ToString('u'))] SUCCESS: Daily backup created -> $backupFile"
    Add-Content -Path $logFile -Value $logMsg
    Write-Host "[SUCCESS] $logMsg" -ForegroundColor Green

    # Retention: clean files older than 30 days
    Get-ChildItem -Path $backupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
} catch {
    $errMsg = "[$((Get-Date).ToString('u'))] ERROR: Daily backup failed: $_"
    Add-Content -Path $logFile -Value $errMsg
    Write-Error $errMsg
    exit 1
}
