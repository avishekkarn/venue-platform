#Requires -Version 7.0
<#
.SYNOPSIS
    Restore a backup into a target database. Destructive.

.DESCRIPTION
    Wraps pg_restore. Restores a .sql.gz backup (as written by
    scripts/backup-daily.ps1) into the database named by -TargetDatabase
    (or $env:RESTORE_DB_URL). The target is wiped before restore:
    pg_restore runs with --clean --if-exists, which drops every object
    in the target before recreating it.

    Requires -Force. Without it, the script prints the target database
    name and refuses. This is a destructive operation; a confirmation
    gate is mandatory.

    The script never restores into the DATABASE_URL's database. Even with
    -Force, if -TargetDatabase (or RESTORE_DB_URL) equals DATABASE_URL,
    the script refuses. A restore into the app's own database is a
    catastrophic mistake regardless of confirmation.

.PARAMETER BackupFile
    Path to a .sql.gz backup file. Required.

.PARAMETER TargetDatabase
    Connection string for the target database (postgresql://...). If
    omitted, reads $env:RESTORE_DB_URL.

.PARAMETER Force
    Required. Confirms the destructive operation.

.EXAMPLE
    .\scripts\restore-backup.ps1 -BackupFile .\backups\2026-11-12.sql.gz -Force

.EXAMPLE
    $env:RESTORE_DB_URL = 'postgresql://postgres:pw@localhost:5432/venue_restore_test'
    .\scripts\restore-backup.ps1 -BackupFile .\backups\2026-11-12.sql.gz -Force

.NOTES
    Reference: DECISIONS.md D-8.5 (daily, 30 days, storage bounded),
    SYSTEM.md §18.5, scripts/README.md, WIRING.md W-0022 (restore-test
    obligation, discharged at Phase 10.6.1).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,

    [Parameter(Mandatory = $false)]
    [string]$TargetDatabase,

    [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Log {
    param([string]$Message)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    Write-Host "[$stamp] $Message"
}

if (-not (Test-Path -LiteralPath $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$target = if ($TargetDatabase) { $TargetDatabase } else { $env:RESTORE_DB_URL }
if (-not $target) {
    Write-Error 'Target database not specified. Pass -TargetDatabase or set RESTORE_DB_URL.'
    exit 1
}

# Refuse to restore into the app's own database. This is a hard guard,
# not a warning. The app's DATABASE_URL points at the production (or
# development) database; restoring over it would destroy live data.
$appDb = $env:DATABASE_URL
if ($appDb -and ($appDb -eq $target)) {
    Write-Error 'Refusing to restore into DATABASE_URL. The restore target must be a separate database. Pass -TargetDatabase with a distinct database name.'
    exit 1
}

if (-not $Force) {
    Write-Error "Restore would overwrite the target database. Target: $target. Pass -Force to proceed."
    exit 1
}

$targetDbName = 'unknown'
if ($target -match '/([^/?]+)(?:\?|$)') {
    $targetDbName = $Matches[1]
}
Write-Log "Restoring $BackupFile into database '$targetDbName'."

try {
    # gzip -d -c | pg_restore streams the .sql.gz into pg_restore without a
    # temporary .sql file on disk. pg_restore --clean --if-exists drops
    # each object before creating it, so the target is wiped clean.
    & gzip -d -c $BackupFile | & pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$target
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pg_restore exited with code $LASTEXITCODE. Restore failed."
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "Restore failed: $_"
    exit 1
}

Write-Log 'Restore completed successfully.'
exit 0

