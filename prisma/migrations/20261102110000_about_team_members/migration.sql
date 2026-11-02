CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "joinedAt" DATE,
    "specialty" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeamMember_sortOrder_createdAt_idx" ON "TeamMember"("sortOrder", "createdAt");

INSERT INTO "TeamMember" ("id", "name", "role", "bio", "image", "imageAlt", "specialty", "sortOrder", "updatedAt") VALUES
    ('team-abdulrahman-al-saud', 'Abdulrahman Al-Saud', 'Founder & Managing Partner', '18 years advising Riyadh''s leading families on prime residential and land.', '/images/t1.jpg', 'Abdulrahman Al-Saud', '', 1, CURRENT_TIMESTAMP),
    ('team-lama-al-qahtani', 'Lama Al-Qahtani', 'Head of Private Clients', 'Leads off-market acquisitions and our concierge buying service.', '/images/t2.jpg', 'Lama Al-Qahtani', '', 2, CURRENT_TIMESTAMP),
    ('team-omar-haddad', 'Omar Haddad', 'Director, Investment Vault', 'Former fund analyst; builds yield models for every vault listing.', '/images/t3.jpg', 'Omar Haddad', '', 3, CURRENT_TIMESTAMP),
    ('team-hessa-al-rashid', 'Dr. Hessa Al-Rashid', 'Head of Design & Development', 'Architect overseeing developer due diligence and snagging.', '/images/t4.jpg', 'Dr. Hessa Al-Rashid', '', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
