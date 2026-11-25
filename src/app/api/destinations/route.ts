import { NextResponse } from "next/server";
import { getPublicDestinations } from "@/lib/destinations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limitValue = Number(new URL(request.url).searchParams.get("limit"));
  const all = await getPublicDestinations();
  const destinations = Number.isInteger(limitValue) && limitValue > 0 ? all.slice(0, Math.min(limitValue, 100)) : all;
  return NextResponse.json(destinations, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
}
