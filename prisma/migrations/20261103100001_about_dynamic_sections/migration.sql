ALTER TABLE "AboutSection"
    ADD COLUMN IF NOT EXISTS "items" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "AboutSection"
    ALTER COLUMN "image" DROP NOT NULL;

UPDATE "AboutSection" SET "sortOrder" = 1 WHERE "id" = 'about-hero-main';

INSERT INTO "AboutSection" ("id", "type", "title", "description", "image", "imageAlt", "buttonLabel", "buttonDestination", "items", "sortOrder", "updatedAt") VALUES
    ('about-values-main', 'VALUE_CARDS', 'Our values', '', NULL, '', '', '', '[{"title":"Discretion","description":"Private releases and off-market homes are handled with complete confidentiality."},{"title":"Verification","description":"Every deed, permit and licence is checked against Ejar and REGA before we show a home."},{"title":"Long view","description":"We advise as if we''ll know you for decades — because most of our clients return."}]'::jsonb, 2, CURRENT_TIMESTAMP),
    ('about-journey-main', 'JOURNEY_TIMELINE', 'Our journey', '', NULL, '', '', '', '[{"title":"2008","description":"Founded in Riyadh as a two-person villa brokerage."},{"title":"2014","description":"Opened Jeddah office and launched property management."},{"title":"2019","description":"Investment Vault launched for yield-focused buyers."},{"title":"2023","description":"Official advisory partner for giga-project residences."},{"title":"2026","description":"SAR 6B transacted and 2,400+ clients housed."}]'::jsonb, 3, CURRENT_TIMESTAMP),
    ('about-team-main', 'TEAM', 'Meet the team', '', NULL, '', '', '', '[]'::jsonb, 4, CURRENT_TIMESTAMP),
    ('about-cta-main', 'CTA_BANNER', 'Let''s find your address.', '', NULL, '', 'Talk to an advisor', '/contact', '[]'::jsonb, 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
