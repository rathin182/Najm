import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: {
      status: "LIVE",
      featured: false,
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 4,
    include: {
      media: {
        orderBy: { position: "asc" },
      },
    },
  });

  return Response.json(
    listings.map(listingToProperty),
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}