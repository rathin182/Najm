import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = await prisma.destination.findUnique({ where: { id }, select: { id: true, name: true, image: true, description: true } });
  if (!destination) return Response.json({ error: "Destination not found." }, { status: 404 });
  const listings = await prisma.listing.findMany({
    where: { destinationId: id, status: "LIVE" },
    include: { media: { where: { kind: "IMAGE", status: "READY" }, orderBy: { position: "asc" } } },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
  });
  return Response.json({ destination, properties: listings.map(listingToProperty) }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
}
