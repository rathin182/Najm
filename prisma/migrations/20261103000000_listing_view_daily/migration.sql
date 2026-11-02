-- CreateTable
CREATE TABLE "ListingViewDaily" (
    "day" DATE NOT NULL,
    "propertySlug" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingViewDaily_pkey" PRIMARY KEY ("day","propertySlug")
);

-- CreateIndex
CREATE INDEX "ListingViewDaily_day_idx" ON "ListingViewDaily"("day");
