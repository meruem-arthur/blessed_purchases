-- Receipts now carry a single signatory, the CEO. The former President details
-- are kept (renamed) so an already-uploaded signature carries over; the
-- Treasurer details are no longer used.
ALTER TABLE "receipt_settings" RENAME COLUMN "presidentName" TO "ceoName";
ALTER TABLE "receipt_settings" RENAME COLUMN "presidentSignature" TO "ceoSignature";
ALTER TABLE "receipt_settings" DROP COLUMN "treasurerName";
ALTER TABLE "receipt_settings" DROP COLUMN "treasurerSignature";
