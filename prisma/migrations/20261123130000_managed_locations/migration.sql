CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
CREATE INDEX "Location_sortOrder_name_idx" ON "Location"("sortOrder", "name");

INSERT INTO "Location" ("id", "name", "sortOrder", "createdAt", "updatedAt")
SELECT DISTINCT ON (LOWER("value"))
  "id",
  "value",
  "position",
  "createdAt",
  "updatedAt"
FROM "HomeSearchOption"
WHERE "group" = 'locations' AND BTRIM("value") <> ''
ORDER BY LOWER("value"), "position" ASC, "createdAt" ASC;

DELETE FROM "HomeSearchOption" WHERE "group" = 'locations';
