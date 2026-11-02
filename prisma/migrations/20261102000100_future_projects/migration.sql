CREATE TABLE IF NOT EXISTS "FutureProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deadlineDate" DATE,
    "deadlineNote" TEXT NOT NULL DEFAULT '',
    "budget" DOUBLE PRECISION,
    "text" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FutureProject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FutureProject_published_sortOrder_idx" ON "FutureProject"("published", "sortOrder");

INSERT INTO "FutureProject" (
    "id", "name", "region", "status", "deadlineNote", "budget", "text", "image", "imageAlt", "published", "sortOrder", "updatedAt"
) VALUES
    ('homepage-1', 'NEOM — The Line', 'Tabuk Province', 'Under construction', '2030 (phase one)', 1900000000000, 'A 170 km linear city redefining urban living — zero cars, zero streets, powered entirely by renewable energy.', '/images/g1.jpg', 'NEOM — The Line', true, 1, CURRENT_TIMESTAMP),
    ('homepage-2', 'Red Sea Global', 'West Coast', 'Phased opening', '2030 (full completion)', 75000000000, 'A regenerative tourism destination across 90 pristine islands, with ultra-luxury resorts and residences.', '/images/g2.jpg', 'Red Sea Global', true, 2, CURRENT_TIMESTAMP),
    ('homepage-3', 'Diriyah Gate', 'Riyadh', 'Building now', '2030', 236000000000, 'The birthplace of the Kingdom reborn as a world-class cultural, living and hospitality district.', '/images/g3.jpg', 'Diriyah Gate', true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
