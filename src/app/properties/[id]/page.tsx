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
    let listing;
    try {
      listing = await prisma.listing.findFirst({
        where: { slug, status: "LIVE" },
        include: { media: { orderBy: { position: "asc" } }, agent: true },
      });
    } catch (error) {
      // Older deployed databases may not have the Agent.role migration yet.
      // Keep the listing page available while omitting its optional agent data.
      const missingAgentRole =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2022" &&
        "meta" in error &&
        typeof error.meta === "object" &&
        error.meta !== null &&
        "column" in error.meta &&
        error.meta.column === "Agent.role";

      if (!missingAgentRole) throw error;

      listing = await prisma.listing.findFirst({
        where: { slug, status: "LIVE" },
        include: { media: { orderBy: { position: "asc" } } },
      });
    }
    if (listing) property = listingToProperty(listing);
  }

  if (!property) notFound();
  return <PropertyDetailClient initialProperty={property} />;
}
