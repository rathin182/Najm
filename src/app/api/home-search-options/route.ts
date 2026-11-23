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
  const [rows, locations] = await Promise.all([
    prisma.homeSearchOption.findMany({
      where: { enabled: true },
      orderBy: [{ group: "asc" }, { position: "asc" }],
    }),
    prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const options = groupHomeSearchOptions(rows);
  options.locations = locations.map(({ id, name, featured, image, sortOrder }) => ({ id, value: name, label: name, featured, image, sortOrder }));
  return NextResponse.json(options, {
    headers: { "Cache-Control": "no-store" },
  });
}
