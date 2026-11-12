# scripts/ — The Operational Scripts

**Purpose:** The operational scripts for the venue's deployment. These are
not part of the application; they are the tools the developer (and, at a
venue, the operator) runs to keep the venue's data safe and recoverable.

**Status:** Phase 7.7.3, split into 7.7.3.A (this session — the backup
half) and 7.7.3.B (the restore half). The backup scripts are present and
proven by 7.7.3.A's manual checks. The restore scripts and the recovery
procedure's quarterly test are shipped by 7.7.3.B. The scripts implement
D-8.5 (daily automatic backup, 30-day retention, backup outside the
database). The restore-test obligation is W-0022; its script-half is
satisfied by this milestone; its scheduling-half is satisfied at Phase
10.6.1 (the real-venue dry run).

---

## The Files

| File | Platform | Purpose |
|------|----------|---------|
| `backup-daily.ps1` | Windows (PowerShell 7+) | Daily database backup: `pg_dump` → gzip → `${BACKUP_DIR}/YYYY-MM-DD.sql.gz`. Prunes files older than 30 days. |
| `backup-daily.sh` | Linux / macOS / WSL | Same behaviour, bash. |

The restore scripts (`restore-backup.ps1`, `restore-backup.sh`) are the
deliverable of 7.7.3.B and are documented in the section 7.7.3.B adds.

---

## Prerequisites

The backup scripts wrap the standard PostgreSQL client tools. Both must
be on `PATH`:

| Tool | Version | Install |
|------|---------|---------|
| `pg_dump` | 14 or later (built against 18.x) | Installed with the PostgreSQL client (`apt install postgresql-client` on Linux; part of the PostgreSQL installer on Windows) |
| `gzip` | Any | Ships with GNU coreutils on Linux/macOS; part of Git for Windows' bash on Windows |
| `pwsh` (PowerShell 7) | 7.0 or later | `winget install --id Microsoft.PowerShell --source winget` (Windows only; the `.sh` scripts do not need it) |

The `.ps1` scripts require PowerShell 7 (not Windows PowerShell 5.1).
The `#Requires -Version 7.0` line at the top of each script enforces
this: PS5.1 will refuse to run the script with a clear error. This is
deliberate. PowerShell 5.1's pipeline exit-code propagation is
unreliable; a failed `pg_dump` piped into a successful `gzip` would
exit zero under PS5.1, which is the "silently failed backup" failure
mode the scripts exist to prevent. PS7's `$LASTEXITCODE` propagates
the failing command correctly.

---

## Configuration

Two environment variables govern the backup scripts:

| Variable | Default | Meaning |
|----------|---------|---------|
| `BACKUP_DIR` | `backups/` (relative to CWD) | Where backups are written and pruned. **In production this MUST point outside the database's disk** (per D-8.5). Recommended production value: a mounted backup disk or a UNC path. |
| `DATABASE_URL` | *(required)* | The database to back up. The same value the application uses. |

The restore scripts (added by 7.7.3.B) add `RESTORE_DB_URL` and the
`-TargetDatabase` / `--target` flag. They are documented in the section
7.7.3.B adds.

---

## Installing the Daily Backup

### Windows (Task Scheduler)

1. Copy `backup-daily.ps1` to `C:\QR-PROJECT\scripts\`.
2. Set `BACKUP_DIR` and `DATABASE_URL` in the system environment (or in the task's action).
3. Register the daily task. **Note the `pwsh.exe` — PowerShell 7, not `powershell.exe` (5.1).**

```powershell
schtasks /Create /SC DAILY /TN "Venue Daily Backup" /TR "pwsh.exe -NoProfile -ExecutionPolicy Bypass -File C:\QR-PROJECT\scripts\backup-daily.ps1" /ST 02:00 /RL HIGHEST /F
```

Verify the task is registered:

```powershell
schtasks /Query /TN "Venue Daily Backup"
```

Set the task's failure notification to email or a monitoring webhook. A
backup that fails silently is a backup that does not exist. Task
Scheduler's default failure notification is a system event log entry;
the venue's operator must be told where to look.

### Linux (cron)

1. Copy `backup-daily.sh` to `/opt/venue/scripts/` and `chmod +x backup-daily.sh`.
2. Set `BACKUP_DIR` and `DATABASE_URL` in `/opt/venue/.env` and source it from the cron job.
3. Add to `crontab -e`:

```text
MAILTO=ops@venue.example
0 2 * * * /opt/venue/scripts/backup-daily.sh >> /var/log/venue-backup.log 2>&1
```

Verify:

```bash
crontab -l | grep venue
```

`MAILTO` makes cron email the operator on any non-zero exit. Without it,
a failed backup is silent.

---

## Alerting

The scripts' non-zero exit is the alert channel. A production deployment
must be configured so that a non-zero exit reaches the operator:

- **Windows:** Task Scheduler's failure notification (event log + email/webhook).
- **Linux:** cron's `MAILTO` (email on any non-zero exit).

The scripts do not retry. A failed backup must be visible; a silent
retry hides the failure mode and lets a backupless venue go unnoticed.

---

## Disk Space

A `.sql.gz` for a busy single-venue installation is typically 1–10 MB
compressed (30 days ≈ 30–300 MB). The operator plans for the ceiling at
onboarding and monitors the `BACKUP_DIR`'s free space. When the volume
grows past 30 days' worth of `.sql.gz`, the retention prunes the oldest
files automatically.

---

## The "Outside the Database" Rule

D-8.5 requires backups to live outside the database's own disk. If
`BACKUP_DIR` resolves to the same disk the database uses, a disk failure
loses both the live data and the backups. In production, `BACKUP_DIR`
must point at a separate disk, a mounted network share, or an object
storage mount. This is the operator's configuration responsibility; the
script enforces nothing (a script cannot detect a mount), but the README
and the `.env.production.example` reference make it clear.

---

## Restore and the Quarterly Restore Test

*(The 7.7.3.B session adds this section. It documents the restore scripts,
the `-Force` / `--force` confirmation gate, and the quarterly restore
test that discharges W-0022's script-half.)*

---

## What This Directory Does Not Do

- **It does not schedule itself.** Scheduling is the OS's job (Task Scheduler
  or cron), documented above. A script that schedules itself is a footgun.
- **It does not manage retention beyond 30 days.** A larger window is a
  decision for a later version (D-8.5's reopen trigger).
- **It does not encrypt the `.sql.gz`.** Encryption at rest is a separate
  concern (the production disk's encryption covers it; a future iteration
  may add script-level encryption if the backup disk is not encrypted).
- **It does not push to cloud storage.** A future iteration may add this when
  a venue asks for offsite copies.

---

## References

- `DECISIONS.md` D-8.5 — daily backup, 30-day retention.
- `docs/SYSTEM.md` §18.5 (added by 7.7.3.B) — the operational backup
  scripts.
- `docs/WIRING.md` W-0022 — the restore-test obligation (Phase 10.6.1
  completes it by proving the schedule is registered at the venue).
- `docs/DEPLOYMENT.md` (Phase 10.7) — the full production deployment
  procedure, including the backup schedule's installation.

