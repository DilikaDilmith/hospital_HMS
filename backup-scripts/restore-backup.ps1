<#
.SYNOPSIS
    HMS Safe Backup Restoration Utility (PowerShell)
.DESCRIPTION
    Safely restores MySQL database dumps (.sql) and weekly full packages (.zip) containing patient documents.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BackupPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupPath)) {
    Write-Error "Specified backup file does not exist: $BackupPath"
    exit 1
}

$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "hms" }

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir     = Split-Path -Parent $scriptDir
$restoreTemp = Join-Path $scriptDir "backups\restore_temp"
$uploadsDir  = Join-Path $rootDir "hms-backend\uploads\patient-documents"

Write-Host "====================================================================" -ForegroundColor Yellow
Write-Host "ATTENTION: DATABASE RESTORATION" -ForegroundColor Yellow
Write-Host "Target Database: $dbName on $dbHost:$dbPort"
Write-Host "Backup File:     $BackupPath"
Write-Host "====================================================================" -ForegroundColor Yellow
Write-Host "WARNING: This will overwrite existing records in database '$dbName'!" -ForegroundColor Red

$confirm = Read-Host "To proceed, type 'CONFIRM'"
if ($confirm -ne "CONFIRM") {
    Write-Host "Restoration cancelled. No changes were made." -ForegroundColor Cyan
    exit 0
}

$mysqlArgs = @(
    "-h", $dbHost,
    "-P", $dbPort,
    "-u", $dbUser,
    $dbName
)

if ($env:DB_PASSWORD) {
    $mysqlArgs = @("--password=$($env:DB_PASSWORD)") + $mysqlArgs
}

$extension = [System.IO.Path]::GetExtension($BackupPath).ToLower()

try {
    if ($extension -eq ".sql") {
        Write-Host "Restoring database from SQL dump: $BackupPath..."
        Get-Content $BackupPath -Encoding utf8 | & mysql.exe $mysqlArgs
        Write-Host "[SUCCESS] Database restored successfully!" -ForegroundColor Green
    } elseif ($extension -eq ".zip") {
        Write-Host "Extracting archive to temporary directory..."
        if (Test-Path $restoreTemp) { Remove-Item -Path $restoreTemp -Recurse -Force }
        Expand-Archive -Path $BackupPath -DestinationPath $restoreTemp -Force

        $sqlFile = Get-ChildItem -Path $restoreTemp -Filter "*.sql" | Select-Object -First 1
        if ($sqlFile) {
            Write-Host "Restoring database from extracted $($sqlFile.FullName)..."
            Get-Content $sqlFile.FullName -Encoding utf8 | & mysql.exe $mysqlArgs
        }

        $docsFolder = Join-Path $restoreTemp "patient-documents"
        if (Test-Path $docsFolder) {
            Write-Host "Restoring patient documents to $uploadsDir..."
            if (-not (Test-Path $uploadsDir)) { New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null }
            Copy-Item -Path (Join-Path $docsFolder "*") -Destination $uploadsDir -Recurse -Force
        }

        Remove-Item -Path $restoreTemp -Recurse -Force
        Write-Host "[SUCCESS] Weekly full backup (DB + Documents) restored successfully!" -ForegroundColor Green
    } else {
        Write-Error "Unsupported file extension '$extension'. Only .sql and .zip are supported."
        exit 1
    }
} catch {
    Write-Error "Restoration failed: $_"
    exit 1
}
