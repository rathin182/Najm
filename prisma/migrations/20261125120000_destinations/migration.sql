ALTER TABLE "Listing" ADD COLUMN "destinationId" TEXT;

CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "image" TEXT NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");
CREATE INDEX "Listing_destinationId_status_idx" ON "Listing"("destinationId", "status");

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_destinationId_fkey"
FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
