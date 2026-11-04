import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WHY_NAJM, toWhyNajmSettings } from "@/lib/why-najm";

export const dynamic = "force-dynamic";

export async function GET() {
  let data = DEFAULT_WHY_NAJM;
  try {
    const row = await prisma.whyNajmSettings.findUnique({ where: { id: "main" } });
    data = toWhyNajmSettings(row);
  } catch (error) {
    if ((error as { code?: string }).code !== "P2021") console.error("Why Najm settings could not be loaded", error);
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
