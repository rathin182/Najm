import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupHomeSearchOptions } from "@/lib/home-search-options";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.homeSearchOption.findMany({
    where: { enabled: true },
    orderBy: [{ group: "asc" }, { position: "asc" }],
  });
  return NextResponse.json(groupHomeSearchOptions(rows), {
    headers: { "Cache-Control": "no-store" },
  });
}
