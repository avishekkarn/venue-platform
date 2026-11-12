#Requires -Version 7.0
<#
.SYNOPSIS
    Daily backup of the venue's PostgreSQL database.

.DESCRIPTION
    Wraps pg_dump. Writes a gzip-compressed custom-format dump to
    $env:BACKUP_DIR/YYYY-MM-DD.sql.gz (default BACKUP_DIR=backups/).
    Prunes .sql.gz files older than 30 days (per D-8.5). Exits non-zero
    on pg_dump failure — no retry, no silent fallback.

    The scheduler (Windows Task Scheduler; see scripts/README.md) invokes
    this script with pwsh.exe. Its exit code is the alert channel: a
    non-zero exit triggers the scheduler's failure notification. A backup
    that silently retries is a backup that masks disk-full, credential-
    expiry, and network-partition failures. A backup that loudly fails
    lets the operator act.

.PARAMETER DryRun
    Prints what would be done, does not run pg_dump, does not write files.

.EXAMPLE
    .\scripts\backup-daily.ps1

.EXAMPLE
    .\scripts\backup-daily.ps1 -DryRun

.NOTES
    Reference: DECISIONS.md D-8.5 (daily, 30 days, storage bounded),
    SYSTEM.md §18.5, scripts/README.md, WIRING.md W-0022 (restore-test
    obligation, discharged at Phase 10.6.1).
#>
[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$script:exitCode = 0

function Write-Log {
    param([string]$Message)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    Write-Host "[$stamp] $Message"
}

function Fail {
    param([string]$Message)
    Write-Log "ERROR: $Message" | Write-Error
    $script:exitCode = 1
}

# 1. Resolve BACKUP_DIR.
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR.Trim() } else { 'backups' }
Write-Log "BACKUP_DIR=$backupDir"

# 2. Resolve DATABASE_URL. The dump uses the same connection the app uses.
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Fail 'DATABASE_URL is not set. The backup cannot run without it.'
    exit $script:exitCode
}

# 3. Compute today's UTC date and output path.
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$outFile = Join-Path $backupDir "$stamp.sql.gz"
Write-Log "Output file: $outFile"

if ($DryRun) {
    Write-Log 'DryRun: not running pg_dump, not pruning.'
    exit 0
}

# 4. Ensure the backup directory exists.
if (-not (Test-Path -LiteralPath $backupDir)) {
    try {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Write-Log "Created backup directory: $backupDir"
    } catch {
        Fail "Cannot create backup directory '$backupDir': $_"
        exit $script:exitCode
    }
}

# 5. Run pg_dump | gzip. The pipe is intentional: pg_dump writes to stdout,
#    gzip reads stdin. No intermediate uncompressed file is written to disk.
#    PowerShell 7's native-command pipeline propagates the failing command's
#    exit code to $LASTEXITCODE; PowerShell 5.1 does not, which is why this
#    script requires PS7 (#Requires).
Write-Log "Running pg_dump -> $outFile (gzip)"

try {
    & pg_dump --format=custom --no-owner --no-privileges --dbname=$databaseUrl `
        | & gzip -9 > $outFile
    if ($LASTEXITCODE -ne 0) {
        Fail "pg_dump exited with code $LASTEXITCODE. Backup failed."
        if (Test-Path -LiteralPath $outFile) { Remove-Item -LiteralPath $outFile -Force }
        exit $script:exitCode
    }
} catch {
    Fail "pg_dump | gzip failed: $_"
    if (Test-Path -LiteralPath $outFile) { Remove-Item -LiteralPath $outFile -Force }
    exit $script:exitCode
}

# 6. Sanity: the file exists and is non-empty.
if (-not (Test-Path -LiteralPath $outFile)) {
    Fail "pg_dump succeeded but the output file does not exist: $outFile"
    exit $script:exitCode
}
$size = (Get-Item -LiteralPath $outFile).Length
if ($size -le 0) {
    Fail "pg_dump produced an empty file: $outFile"
    exit $script:exitCode
}
Write-Log "Backup written: $outFile ($size bytes)"

# 7. Retention: prune .sql.gz files older than 30 days (per D-8.5).
$cutoff = (Get-Date).ToUniversalTime().AddDays(-30)
$pruned = @()
Get-ChildItem -LiteralPath $backupDir -Filter '*.sql.gz' | ForEach-Object {
    if ($_.LastWriteTimeUtc -lt $cutoff) {
        Write-Log "Pruning old backup: $($_.FullName) (LastWriteTimeUtc=$($_.LastWriteTimeUtc.ToString('yyyy-MM-dd')))"
        Remove-Item -LiteralPath $_.FullName -Force
        $pruned += $_.Name
    }
}
if ($pruned.Count -eq 0) {
    Write-Log 'Retention: no files older than 30 days to prune.'
} else {
    Write-Log "Retention: pruned $($pruned.Count) file(s)."
}

Write-Log 'Backup completed successfully.'
exit 0

