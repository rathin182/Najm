CREATE TABLE IF NOT EXISTS "AboutSection" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "buttonLabel" TEXT NOT NULL DEFAULT '',
    "buttonDestination" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AboutSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AboutSection_type_sortOrder_idx" ON "AboutSection"("type", "sortOrder");

INSERT INTO "AboutSection" ("id", "type", "title", "description", "image", "imageAlt", "buttonLabel", "buttonDestination", "sortOrder", "updatedAt") VALUES
    ('about-hero-main', 'HERO_IMAGE', 'A Saudi story of homes and trust.', 'Najm means “star”. Since 2008 we have guided families, founders and global investors to the addresses that shape their lives across the Kingdom.', '/images/office.jpg', 'Najm Estate Riyadh office', '', '', 1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
