-- CreateTable
CREATE TABLE "WhyNajmSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "headingAccent" TEXT NOT NULL DEFAULT 'Why',
    "heading" TEXT NOT NULL DEFAULT 'Najm?',
    "intro" TEXT NOT NULL DEFAULT '',
    "stats" JSONB NOT NULL DEFAULT '[]',
    "pillarsTitle" TEXT NOT NULL DEFAULT '',
    "pillarsAccent" TEXT NOT NULL DEFAULT '',
    "pillars" JSONB NOT NULL DEFAULT '[]',
    "loungeImage" TEXT NOT NULL DEFAULT '',
    "loungeImageAlt" TEXT NOT NULL DEFAULT '',
    "loungeLabel" TEXT NOT NULL DEFAULT '',
    "loungeText" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT '[]',
    "teamTitle" TEXT NOT NULL DEFAULT '',
    "teamAccent" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhyNajmSettings_pkey" PRIMARY KEY ("id")
);
