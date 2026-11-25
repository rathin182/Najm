CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "age" INTEGER NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "review" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(40) NOT NULL,
    "whatsapp" VARCHAR(40),
    "email" VARCHAR(254) NOT NULL,
    "address" VARCHAR(300) NOT NULL,
    "description" VARCHAR(1000),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Agent_verified_name_idx" ON "Agent"("verified", "name");
