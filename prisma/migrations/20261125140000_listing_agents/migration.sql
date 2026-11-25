ALTER TABLE "Listing" ADD COLUMN "agentId" TEXT;

CREATE INDEX "Listing_agentId_idx" ON "Listing"("agentId");

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
