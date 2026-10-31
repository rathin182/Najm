import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_SETTINGS, toContactSettings } from "@/lib/contact-settings";

export const dynamic = "force-dynamic";
export async function GET() {
  let data = DEFAULT_CONTACT_SETTINGS;
  try {
    const row = await prisma.contactSettings.findUnique({ where: { id: "main" } });
    data = toContactSettings(row);
  } catch (error) {
    if ((error as { code?: string }).code !== "P2021") throw error;
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}