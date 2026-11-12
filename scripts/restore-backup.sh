#!/usr/bin/env bash
# Restore a backup into a target database. Destructive.
#
# Wraps pg_restore. Restores a .sql.gz backup (as written by
# scripts/backup-daily.sh) into the database named by --target (or
# $RESTORE_DB_URL). The target is wiped before restore: pg_restore runs
# with --clean --if-exists, which drops every object in the target
# before recreating it.
#
# Requires --force. Without it, the script prints the target database
# name and refuses. This is a destructive operation; a confirmation gate
# is mandatory.
#
# The script never restores into the DATABASE_URL's database. Even with
# --force, if --target (or RESTORE_DB_URL) equals DATABASE_URL, the
# script refuses. A restore into the app's own database is a catastrophic
# mistake regardless of confirmation.
#
# Reference: DECISIONS.md D-8.5 (daily, 30 days, storage bounded),
# SYSTEM.md §18.5, scripts/README.md, WIRING.md W-0022 (restore-test
# obligation, discharged at Phase 10.6.1).

set -Eeuo pipefail

BACKUP_FILE=""
TARGET=""
FORCE=0

while [ "$#" -gt 0 ]; do
    case "$1" in
        --backup-file)
            if [ "$#" -lt 2 ]; then
                echo "Error: --backup-file requires a path" >&2
                exit 2
            fi
            BACKUP_FILE="$2"
            shift 2
            ;;
        --target)
            if [ "$#" -lt 2 ]; then
                echo "Error: --target requires a connection string" >&2
                exit 2
            fi
            TARGET="$2"
            shift 2
            ;;
        --force)
            FORCE=1
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            echo "Usage: $0 --backup-file PATH [--target URL] [--force]" >&2
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

if [ -z "$BACKUP_FILE" ]; then
    fail "Missing required --backup-file."
fi
if [ ! -f "$BACKUP_FILE" ]; then
    fail "Backup file not found: $BACKUP_FILE"
fi

if [ -z "$TARGET" ]; then
    TARGET="${RESTORE_DB_URL:-}"
fi
if [ -z "$TARGET" ]; then
    fail "Target database not specified. Pass --target or set RESTORE_DB_URL."
fi

APP_DB="${DATABASE_URL:-}"
if [ -n "$APP_DB" ] && [ "$APP_DB" = "$TARGET" ]; then
    fail "Refusing to restore into DATABASE_URL. The restore target must be a separate database."
fi

if [ "$FORCE" -ne 1 ]; then
    fail "Restore would overwrite the target database. Target: $TARGET. Pass --force to proceed."
fi

TARGET_DB_NAME="unknown"
case "$TARGET" in
    */*)
        REST="${TARGET#*/}"
        REST="${REST%%\?*}"
        TARGET_DB_NAME="${REST##*/}"
        ;;
esac
log "Restoring $BACKUP_FILE into database '$TARGET_DB_NAME'."

if ! gzip -dc "$BACKUP_FILE" | pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$TARGET"; then
    fail "pg_restore failed. Restore failed."
fi

log "Restore completed successfully."
exit 0

