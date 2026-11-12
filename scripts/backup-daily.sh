#!/usr/bin/env bash
# Daily backup of the venue's PostgreSQL database.
#
# Wraps pg_dump. Writes a gzip-compressed custom-format dump to
# $BACKUP_DIR/YYYY-MM-DD.sql.gz (default BACKUP_DIR=backups/). Prunes
# .sql.gz files older than 30 days (per D-8.5). Exits non-zero on
# pg_dump failure — no retry, no silent fallback.
#
# The scheduler (cron; see scripts/README.md) invokes this script. Its
# exit code is the alert channel: a non-zero exit is captured by cron's
# MAILTO notification. A backup that silently retries is a backup that
# masks disk-full, credential-expiry, and network-partition failures.
#
# Reference: DECISIONS.md D-8.5 (daily, 30 days, storage bounded),
# SYSTEM.md §18.5, scripts/README.md, WIRING.md W-0022 (restore-test
# obligation, discharged at Phase 10.6.1).

set -Eeuo pipefail

DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        *)
            echo "Unknown argument: $arg" >&2
            echo "Usage: $0 [--dry-run]" >&2
            exit 2
            ;;
    esac
done

log() {
    printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
    log "ERROR: $*" >&2
    exit 1
}

BACKUP_DIR="${BACKUP_DIR:-backups}"
DATABASE_URL="${DATABASE_URL:-}"

log "BACKUP_DIR=$BACKUP_DIR"

if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL is not set. The backup cannot run without it."
fi

STAMP="$(date -u '+%Y-%m-%d')"
OUT_FILE="$BACKUP_DIR/$STAMP.sql.gz"

log "Output file: $OUT_FILE"

if [ "$DRY_RUN" -eq 1 ]; then
    log "DryRun: not running pg_dump, not pruning."
    exit 0
fi

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR" || fail "Cannot create backup directory '$BACKUP_DIR'"
    log "Created backup directory: $BACKUP_DIR"
fi

log "Running pg_dump -> $OUT_FILE (gzip)"

if ! pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" \
    | gzip -9 > "$OUT_FILE"; then
    rm -f "$OUT_FILE"
    fail "pg_dump | gzip failed. Backup failed."
fi

if [ ! -s "$OUT_FILE" ]; then
    rm -f "$OUT_FILE"
    fail "pg_dump succeeded but produced an empty file: $OUT_FILE"
fi

SIZE=$(wc -c < "$OUT_FILE" | tr -d ' ')
log "Backup written: $OUT_FILE ($SIZE bytes)"

CUTOFF_SECONDS=$((30 * 24 * 60 * 60))
NOW_SECONDS=$(date -u '+%s')
PRUNED=0

while IFS= read -r -d '' f; do
    MTIME=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo 0)
    if [ "$MTIME" -gt 0 ] && [ $((NOW_SECONDS - MTIME)) -gt "$CUTOFF_SECONDS" ]; then
        log "Pruning old backup: $f"
        rm -f "$f"
        PRUNED=$((PRUNED + 1))
    fi
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.sql.gz' -print0)

if [ "$PRUNED" -eq 0 ]; then
    log "Retention: no files older than 30 days to prune."
else
    log "Retention: pruned $PRUNED file(s)."
fi

log "Backup completed successfully."
exit 0

