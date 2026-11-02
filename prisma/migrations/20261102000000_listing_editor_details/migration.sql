ALTER TABLE "Listing"
ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}'::jsonb;
