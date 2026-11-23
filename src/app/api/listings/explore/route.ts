import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export async function GET() {
  const topByCity = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT DISTINCT ON (LOWER(BTRIM("city"))) "id"
    FROM "Listing"
    WHERE "status" = 'LIVE'::"ListingStatus" AND BTRIM("city") <> ''
    ORDER BY LOWER(BTRIM("city")), "viewCount" DESC, "createdAt" DESC, "id" ASC
  `;
  const listings = topByCity.length
    ? await prisma.listing.findMany({
        where: { id: { in: topByCity.map(({ id }) => id) } },
        include: { media: { orderBy: { position: "asc" } } },
      })
    : [];
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  const orderedListings = topByCity
    .map(({ id }) => byId.get(id))
    .filter((listing): listing is (typeof listings)[number] => Boolean(listing))
    .sort((a, b) => b.viewCount - a.viewCount || a.city.localeCompare(b.city));

  return Response.json(
    orderedListings.map(listingToProperty),
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
