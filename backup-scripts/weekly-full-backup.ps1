<#
.SYNOPSIS
    HMS Weekly Full Backup Script (PowerShell)
.DESCRIPTION
    Exports MySQL database and bundles it with uploaded patient documents into a compressed .zip archive.
    No credentials are hardcoded.
#>

$ErrorActionPreference = "Stop"

$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "hms_db" }

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir     = Split-Path -Parent $scriptDir
$backupDir   = Join-Path $scriptDir "backups\weekly"
$tempDir     = Join-Path $scriptDir "backups\temp"
$logFile     = Join-Path $scriptDir "backups\backup.log"
$uploadsDir  = Join-Path $rootDir "hms-backend\uploads\patient-documents"

if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
if (-not (Test-Path $tempDir))   { New-Item -ItemType Directory -Path $tempDir -Force | Out-Null }

$timestamp   = (Get-Date).ToString("yyyyMMdd_HHmmss")
$dbDumpFile  = Join-Path $tempDir "hms_db_$timestamp.sql"
$zipFile     = Join-Path $backupDir "hms_full_backup_weekly_$timestamp.zip"
$stageDir    = Join-Path $tempDir "stage_$timestamp"

Write-Host "[$((Get-Date).ToString('u'))] Starting weekly full backup (DB + Documents)..."

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
    # 1. Dump MySQL Database
    & mysqldump.exe $dumpArgs | Out-File -FilePath $dbDumpFile -Encoding utf8

    # 2. Stage files
    New-Item -ItemType Directory -Path $stageDir -Force | Out-Null
    Copy-Item -Path $dbDumpFile -Destination $stageDir

    if (Test-Path $uploadsDir) {
        $targetUploads = Join-Path $stageDir "patient-documents"
        Copy-Item -Path $uploadsDir -Destination $targetUploads -Recurse -Force
    }

    # 3. Compress into unified zip
    Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipFile -Force

    # 4. Cleanup temporary files
    Remove-Item -Path $stageDir -Recurse -Force
    Remove-Item -Path $dbDumpFile -Force

    $logMsg = "[$((Get-Date).ToString('u'))] SUCCESS: Weekly full backup created -> $zipFile"
    Add-Content -Path $logFile -Value $logMsg
    Write-Host "[SUCCESS] $logMsg" -ForegroundColor Green

    # Retention: clean archives older than 60 days
    Get-ChildItem -Path $backupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-60) } | Remove-Item -Force
} catch {
    $errMsg = "[$((Get-Date).ToString('u'))] ERROR: Weekly full backup failed: $_"
    Add-Content -Path $logFile -Value $errMsg
    Write-Error $errMsg
    exit 1
}
