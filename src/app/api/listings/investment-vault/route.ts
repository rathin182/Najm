import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export const dynamic = "force-dynamic";

const VAULT_LIMIT = 4;

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { status: "LIVE", projectedYield: { not: null } },
    include: { media: { orderBy: { position: "asc" } } },
  });

  const top = listings
    .map(listingToProperty)
    .filter((p) => (p.details?.annualRent ?? 0) > 0)
    .sort((a, b) => (b.details?.annualRent ?? 0) - (a.details?.annualRent ?? 0))
    .slice(0, VAULT_LIMIT);

  return Response.json(top);
}