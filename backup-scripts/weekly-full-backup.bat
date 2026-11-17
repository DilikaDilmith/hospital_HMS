@echo off
setlocal enabledelayedexpansion

REM ====================================================================
REM HMS Weekly Full Backup Script (Database + Patient Documents)
REM ====================================================================

REM Set database parameters from environment variables (No hardcoded credentials)
if "%DB_USER%"=="" set DB_USER=root
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3306
if "%DB_NAME%"=="" set DB_NAME=hms_db

REM Set paths
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set BACKUP_DIR=%SCRIPT_DIR%backups\weekly
set TEMP_DIR=%SCRIPT_DIR%backups\temp
set LOG_FILE=%SCRIPT_DIR%backups\backup.log
set UPLOADS_DIR=%ROOT_DIR%\hms-backend\uploads\patient-documents

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" (
    set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=!TIMESTAMP: =0!
) else (
    set TIMESTAMP=%DT:~0,8%_%DT:~8,6%
)

set DB_DUMP_FILE=%TEMP_DIR%\hms_db_%TIMESTAMP%.sql
set ZIP_FILE=%BACKUP_DIR%\hms_full_backup_weekly_%TIMESTAMP%.zip

echo [%date% %time%] Starting weekly full backup (Database + Patient Documents)...

REM 1. Dump database
set PWD_ARG=
if not "%DB_PASSWORD%"=="" set PWD_ARG=--password="%DB_PASSWORD%"

mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %PWD_ARG% --single-transaction --quick --routines --triggers %DB_NAME% > "%DB_DUMP_FILE%"

if %ERRORLEVEL% neq 0 (
    echo [%date% %time%] ERROR: mysqldump failed during weekly backup >> "%LOG_FILE%"
    echo [ERROR] Database dump failed.
    exit /b %ERRORLEVEL%
)

REM 2. Bundle database dump and patient documents into compressed zip
echo Compressing database dump and documents into archive...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$stage = Join-Path '%TEMP_DIR%' 'stage_%TIMESTAMP%';" ^
    "New-Item -ItemType Directory -Path $stage -Force | Out-Null;" ^
    "Copy-Item -Path '%DB_DUMP_FILE%' -Destination $stage;" ^
    "if (Test-Path '%UPLOADS_DIR%') { Copy-Item -Path '%UPLOADS_DIR%' -Destination (Join-Path $stage 'patient-documents') -Recurse -Force; }" ^
    "Compress-Archive -Path (Join-Path $stage '*') -DestinationPath '%ZIP_FILE%' -Force;" ^
    "Remove-Item -Path $stage -Recurse -Force;" ^
    "Remove-Item -Path '%DB_DUMP_FILE%' -Force;"

if exist "%ZIP_FILE%" goto :on_weekly_success

echo [%date% %time%] ERROR: Failed to create zip archive for weekly backup >> "%LOG_FILE%"
echo [ERROR] Failed to generate weekly archive.
exit /b 1

:on_weekly_success
echo [%date% %time%] SUCCESS: Weekly full backup created: %ZIP_FILE% >> "%LOG_FILE%"
echo [SUCCESS] Weekly full backup bundle created!
echo Output: %ZIP_FILE%

REM Retention policy: purge weekly zip archives older than 60 days
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%BACKUP_DIR%' -Filter '*.zip' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-60) } | Remove-Item -Force"

endlocal
