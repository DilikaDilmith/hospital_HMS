@echo off
setlocal enabledelayedexpansion

REM ====================================================================
REM HMS Daily MySQL Database Backup Script (Windows)
REM ====================================================================

REM Set database connection parameters from environment variables (No hardcoded credentials)
if "%DB_USER%"=="" set DB_USER=root
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3306
if "%DB_NAME%"=="" set DB_NAME=hms_db

REM Set target backup directory
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%backups\daily
set LOG_FILE=%SCRIPT_DIR%backups\backup.log

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generate ISO timestamp YYYYMMDD_HHMMSS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" (
    set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=!TIMESTAMP: =0!
) else (
    set TIMESTAMP=%DT:~0,8%_%DT:~8,6%
)

set BACKUP_FILE=%BACKUP_DIR%\hms_daily_%TIMESTAMP%.sql

echo [%date% %time%] Starting daily database backup for '%DB_NAME%'...
echo [%date% %time%] Target output: %BACKUP_FILE%

REM Build password argument safely
set PWD_ARG=
if not "%DB_PASSWORD%"=="" set PWD_ARG=--password="%DB_PASSWORD%"

REM Execute mysqldump
mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %PWD_ARG% --single-transaction --quick --routines --triggers %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 goto :on_success

echo [%date% %time%] ERROR: mysqldump failed with error code %ERRORLEVEL% >> "%LOG_FILE%"
echo [ERROR] Backup failed. Please verify MySQL service status, host: %DB_HOST%, and DB credentials.
exit /b %ERRORLEVEL%

:on_success
echo [%date% %time%] SUCCESS: Daily backup completed successfully: %BACKUP_FILE% >> "%LOG_FILE%"
echo [SUCCESS] Daily backup completed successfully!
echo Output: %BACKUP_FILE%

REM Retention policy: purge daily SQL backups older than 30 days
echo Purging backups older than 30 days...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%BACKUP_DIR%' -Filter '*.sql' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force"

endlocal
