import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupHomeSearchOptions } from "@/lib/home-search-options";

export const dynamic = "force-dynamic";

export async function GET() {
  // const rows = await prisma.homeSearchOption.findMany({
  //   where: { enabled: true },
  //   orderBy: [{ group: "asc" }, { position: "asc" }],
  // });
  // return NextResponse.json(groupHomeSearchOptions(rows), {
  //   headers: { "Cache-Control": "no-store" },
  // });
  const [rows, cityRows] = await Promise.all([
    prisma.homeSearchOption.findMany({
      where: { enabled: true },
      orderBy: [{ group: "asc" }, { position: "asc" }],
    }),
    prisma.listing.findMany({ where: { status: "LIVE" }, select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
  ]);
  const options = groupHomeSearchOptions(rows);
  // Locations = the admin's list plus any city that has a live listing.
  const known = new Set(options.locations.map((option) => option.value.trim().toLowerCase()));
  for (const { city } of cityRows) {
    const name = city?.trim();
    if (!name || known.has(name.toLowerCase())) continue;
    known.add(name.toLowerCase());
    options.locations.push({ value: name, label: name });
  }
  return NextResponse.json(groupHomeSearchOptions(rows), {
    headers: { "Cache-Control": "no-store" },
  });
}
