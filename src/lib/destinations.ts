import { prisma } from "@/lib/prisma";

export async function getPublicDestinations() {
  const destinations = await prisma.destination.findMany({
    include: { listings: { where: { status: "LIVE" }, select: { viewCount: true } } },
  });
  return destinations
    .map(({ listings, ...destination }) => ({
      ...destination,
      views: listings.reduce((total, listing) => total + listing.viewCount, 0),
      propertyCount: listings.length,
    }))
    .sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
}
