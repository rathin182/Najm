import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: { media: { orderBy: { position: "asc" } } },
  });

  if (!listing || listing.status !== "LIVE") return Response.json({ error: "Property not found." }, { status: 404 });

  return Response.json(listingToProperty(listing));
}
