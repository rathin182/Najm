CREATE TYPE "FeaturedPlacement" AS ENUM ('PROPERTIES', 'PROJECTS');

ALTER TABLE "Listing"
ADD COLUMN "featuredPlacement" "FeaturedPlacement" NOT NULL DEFAULT 'PROPERTIES';
