@echo off
setlocal enabledelayedexpansion

REM ====================================================================
REM HMS Safe Backup Restoration Utility (Windows)
REM ====================================================================

if "%~1"=="" (
    echo [USAGE] restore-backup.bat ^<path-to-sql-or-zip-file^>
    echo Example: restore-backup.bat backups\daily\hms_daily_20261118_010000.sql
    echo Example: restore-backup.bat backups\weekly\hms_full_backup_weekly_20261118_020000.zip
    exit /b 1
)

set BACKUP_TARGET=%~f1

if not exist "%BACKUP_TARGET%" (
    echo [ERROR] Specified backup file does not exist: %BACKUP_TARGET%
    exit /b 1
)

REM Set connection parameters
if "%DB_USER%"=="" set DB_USER=root
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3306
if "%DB_NAME%"=="" set DB_NAME=hms

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set RESTORE_TEMP=%SCRIPT_DIR%backups\restore_temp
set UPLOADS_DIR=%ROOT_DIR%\hms-backend\uploads\patient-documents

echo ====================================================================
echo ATTENTION: DATABASE RESTORATION
echo Target database: %DB_NAME% on %DB_HOST%:%DB_PORT%
echo Backup file:     %BACKUP_TARGET%
echo ====================================================================
echo WARNING: Restoring a backup will overwrite current database records!
set /p CONFIRM="To proceed, please type 'CONFIRM': "
if not "%CONFIRM%"=="CONFIRM" (
    echo Restoration cancelled by user. No changes were made.
    exit /b 0
)

set PWD_ARG=
if not "%DB_PASSWORD%"=="" set PWD_ARG=--password="%DB_PASSWORD%"

REM Check file extension (.sql or .zip)
set EXT=%~x1

if /i "%EXT%"==".sql" (
    echo Restoring SQL database from %BACKUP_TARGET%...
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %PWD_ARG% %DB_NAME% < "%BACKUP_TARGET%"
    if %ERRORLEVEL% equ 0 (
        echo [SUCCESS] Database restored successfully from %BACKUP_TARGET%!
    ) else (
        echo [ERROR] Failed to restore database. Error code: %ERRORLEVEL%
        exit /b %ERRORLEVEL%
    )
) else if /i "%EXT%"==".zip" (
    echo Extracting weekly archive...
    if not exist "%RESTORE_TEMP%" mkdir "%RESTORE_TEMP%"

    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%BACKUP_TARGET%' -DestinationPath '%RESTORE_TEMP%' -Force"

    REM Find SQL file inside extracted folder
    for %%F in ("%RESTORE_TEMP%\*.sql") do set SQL_DUMP=%%F

    if exist "!SQL_DUMP!" (
        echo Restoring database from extracted !SQL_DUMP!...
        mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %PWD_ARG% %DB_NAME% < "!SQL_DUMP!"
        if !ERRORLEVEL! neq 0 (
            echo [ERROR] Failed to restore database from zip. Error code: !ERRORLEVEL!
            exit /b !ERRORLEVEL!
        )
    )

    REM Restore patient documents if present
    if exist "%RESTORE_TEMP%\patient-documents" (
        echo Restoring uploaded patient documents to %UPLOADS_DIR%...
        if not exist "%UPLOADS_DIR%" mkdir "%UPLOADS_DIR%"
        xcopy /E /I /Y "%RESTORE_TEMP%\patient-documents\*" "%UPLOADS_DIR%\" >nul
    )

    REM Clean temp folder
    rmdir /S /Q "%RESTORE_TEMP%"
    echo [SUCCESS] Weekly full backup (Database + Documents) restored successfully!
) else (
    echo [ERROR] Unsupported backup format: %EXT%. Only .sql and .zip are supported.
    exit /b 1
)

endlocal
