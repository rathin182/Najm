import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONTACT_SETTINGS,
  toContactSettings,
} from "@/lib/contact-settings";

export const dynamic = "force-dynamic";

// Public data for the site footer: contact details managed in
// Admin → Contact info and Admin → Locations.
export async function GET() {
  let contact = DEFAULT_CONTACT_SETTINGS;

  try {
    const row = await prisma.contactSettings.findUnique({
      where: { id: "main" },
    });
    contact = toContactSettings(row);
  } catch (error) {
    // P2021 = table not created yet; fall back to defaults.
    if ((error as { code?: string }).code !== "P2021") {
      console.error("Footer contact settings failed:", error);
    }
  }

  let cities: string[] = [];

  try {
    const rows = await prisma.location.findMany({
      select: { name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 8,
    });
    cities = rows.map((row) => row.name).filter(Boolean);
  } catch (error) {
    console.error("Footer cities failed:", error);
  }

  return NextResponse.json(
    {
      phone: contact.phone,
      email: contact.email,
      office: contact.offices[0] ?? null,
      cities,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
