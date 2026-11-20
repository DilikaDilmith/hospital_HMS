# Hospital Management System (HMS) - Backup, Recovery & Task Scheduling Guide

This document outlines the backup, restoration, and automated scheduling procedures for the Hospital Management System database and patient files in accordance with the HMS SRS (Sections 4 & 10).

---

## 1. Overview of Backup Strategies

| Backup Type | Frequency | Included Components | Retention Policy | Output Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Database Backup** | Daily (e.g. 01:00 AM) | MySQL Schema, Data, Triggers, Routines (`.sql`) | 30 Days | `backup-scripts/backups/daily/` |
| **Weekly Full Backup** | Weekly (e.g. Sunday 02:00 AM) | MySQL Database Dump + Patient Uploaded Documents (`.zip`) | 60 Days (8 Weeks) | `backup-scripts/backups/weekly/` |

> [!NOTE]
> Backup scripts read database credentials securely from environment variables (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`). No passwords or sensitive tokens are hardcoded.

---

## 2. Running Manual Backups

### A. Daily Database Backup
Runs `mysqldump` and saves a timestamped SQL file.

**Using Command Prompt (CMD):**
```cmd
cd /d "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
daily-db-backup.bat
```

**Using PowerShell:**
```powershell
cd "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
.\daily-db-backup.ps1
```

### B. Weekly Full Backup
Dumps the MySQL database and packages it with uploaded patient documents (`hms-backend/uploads/patient-documents/`) into a compressed `.zip` bundle.

**Using Command Prompt (CMD):**
```cmd
cd /d "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
weekly-full-backup.bat
```

**Using PowerShell:**
```powershell
cd "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
.\weekly-full-backup.ps1
```

---

## 3. Safe Database & Documents Restoration

> [!WARNING]
> Restoring a backup will overwrite current database records. The restoration script requires explicit typed confirmation (`CONFIRM`) before proceeding.

### To restore a Daily Database Dump (`.sql`):
```cmd
cd /d "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
restore-backup.bat backups\daily\hms_daily_YYYYMMDD_HHMMSS.sql
```

### To restore a Weekly Full Archive (`.zip`):
```cmd
cd /d "C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts"
restore-backup.bat backups\weekly\hms_full_backup_weekly_YYYYMMDD_HHMMSS.zip
```
*(This automatically restores both the database records and extracts patient documents back into `hms-backend/uploads/patient-documents/`)*.

---

## 4. Windows Task Scheduler Setup Instructions

> [!IMPORTANT]
> Automatic backups are **not** pre-scheduled in the OS out of the box. To enable automated background execution, a system administrator must register the scheduled tasks using either the Command Line (Option A) or the Windows GUI (Option B).

### Option A: Command Line Setup via `schtasks` (Recommended)

Open **Command Prompt as Administrator** and execute the following commands (replace path with your deployment directory):

1. **Schedule Daily Database Backup (Runs every day at 1:00 AM):**
   ```cmd
   schtasks /create /tn "HMS_Daily_DB_Backup" /tr "\"C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts\daily-db-backup.bat\"" /sc daily /st 01:00 /ru SYSTEM /f
   ```

2. **Schedule Weekly Full Backup (Runs every Sunday at 2:00 AM):**
   ```cmd
   schtasks /create /tn "HMS_Weekly_Full_Backup" /tr "\"C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts\weekly-full-backup.bat\"" /sc weekly /d SUN /st 02:00 /ru SYSTEM /f
   ```

3. **Verify Registered Tasks:**
   ```cmd
   schtasks /query /tn "HMS_Daily_DB_Backup" /fo LIST /v
   schtasks /query /tn "HMS_Weekly_Full_Backup" /fo LIST /v
   ```

---

### Option B: Windows GUI Setup (`taskschd.msc`)

1. Press `Win + R`, type `taskschd.msc`, and press **Enter**.
2. In the right-hand panel, click **Create Task...**
3. **General Tab**:
   - Name: `HMS_Daily_DB_Backup`
   - Description: `Automated daily backup for Hospital Management System database`
   - Security options: Select **Run whether user is logged on or not** and check **Run with highest privileges**.
4. **Triggers Tab**:
   - Click **New...**
   - Begin the task: **On a schedule** -> Select **Daily**.
   - Start time: `01:00:00 AM`. Recur every `1` day.
5. **Actions Tab**:
   - Click **New...**
   - Action: **Start a program**
   - Program/script: `C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts\daily-db-backup.bat`
   - Start in (optional): `C:\Users\dilik\Desktop\Projects\SLT Projects\hms\backup-scripts\`
6. **Conditions & Settings Tab**:
   - Ensure **Wake the computer to run this task** is enabled if on a power-saving server.
   - Check **If the task fails, restart every: 10 minutes** (up to 3 times).
7. Click **OK** and enter administrative credentials.
8. Repeat the same steps for `HMS_Weekly_Full_Backup`, setting trigger to **Weekly** on **Sunday at 02:00 AM** pointing to `weekly-full-backup.bat`.

---

## 5. Backup Logging & Health Auditing

All automated and manual executions write to:
```
backup-scripts/backups/backup.log
```
Each entry logs the date, timestamp, target file, and success or error status for compliance auditing.
