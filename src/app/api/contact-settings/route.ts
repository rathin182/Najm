import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_CARDS } from "@/lib/contact-settings";

export async function GET() {
  let cards;
  try {
    cards = await prisma.contactCard.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        sortOrder: true,
        label: true,
        badge: true,
        title: true,
        address: true,
        phonePrimary: true,
        phoneSecondary: true,
        email: true,
        visitingHours: true,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2021") throw error;
    cards = DEFAULT_CONTACT_CARDS;
  }

  return NextResponse.json(cards, {
    headers: { "Cache-Control": "no-store" },
  });
}
