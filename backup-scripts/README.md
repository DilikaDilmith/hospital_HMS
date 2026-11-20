# HMS Backup Scripts

This directory contains standalone backup and restoration utilities for the Hospital Management System:

- `daily-db-backup.bat` / `.ps1`: Daily MySQL schema and record dumps.
- `weekly-full-backup.bat` / `.ps1`: Weekly full archives bundling MySQL database and patient uploaded documents.
- `restore-backup.bat` / `.ps1`: Safe restoration utility with confirmation prompt.

For complete documentation, recovery procedures, and Windows Task Scheduler setup steps, please refer to:
[BACKUP_AND_RECOVERY.md](../BACKUP_AND_RECOVERY.md)
