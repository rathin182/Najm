import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "LIVE", featured: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    include: { media: { orderBy: { position: "asc" } } },
  });

  return Response.json(listings.map(listingToProperty));
}
