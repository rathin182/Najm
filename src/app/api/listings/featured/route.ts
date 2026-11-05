import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "LIVE", featured: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    include: { media: { orderBy: { position: "asc" } } },
    take: 4,
  });

  // return Response.json(listings.map(listingToProperty));
  return Response.json(listings.map(listingToProperty), {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
}
