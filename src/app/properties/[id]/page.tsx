import { notFound } from "next/navigation";
import type { Property } from "@/data/properties";
import { PROPERTIES } from "@/data/properties";
import { listingToProperty } from "@/lib/listing-property";
import { prisma } from "@/lib/prisma";
import PropertyDetailClient from "./property-detail-client";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  let property: Property | null = PROPERTIES.find((item) => item.id === slug) ?? null;

  if (!property) {
    const listing = await prisma.listing.findFirst({
      where: { slug, status: "LIVE" },
      include: { media: { orderBy: { position: "asc" } } },
    });
    if (listing) property = listingToProperty(listing);
  }

  if (!property) notFound();
  return <PropertyDetailClient initialProperty={property} />;
}
