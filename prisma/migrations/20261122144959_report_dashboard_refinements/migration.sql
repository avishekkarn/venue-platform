-- AlterTable
ALTER TABLE "qr_tokens" ADD COLUMN     "revocationReason" TEXT,
ADD COLUMN     "revokedByStaffId" TEXT;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kathmandu';
