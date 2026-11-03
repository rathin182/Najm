import type { Listing, ListingMedia } from "@/generated/prisma/client";
import type { Property } from "@/data/properties";
import type { AdminProperty, PropertyExtra } from "@/lib/admin-store";

type ListingWithMedia = Listing & { media: ListingMedia[] };

export function listingToProperty(listing: ListingWithMedia): AdminProperty {
  const details = (listing.details && typeof listing.details === "object" ? listing.details : {}) as Partial<PropertyExtra>;
  const images = listing.media.filter((media) => media.kind === "IMAGE" && media.status === "READY").map((media) => media.externalUrl ?? media.storageKey ?? "").filter(Boolean);
  const property: AdminProperty = {
    id: listing.slug,
    title: listing.title,
    city: listing.city,
    district: listing.locality ?? "",
    type: (listing.propertyType ?? (listing.category === "COMMERCIAL" ? "Commercial" : "Villa")) as Property["type"],
    price: Number(listing.price),
    area: listing.areaSqm ?? (listing.areaSqft ? Math.round(listing.areaSqft * 0.092903) : 0),
    beds: listing.bedrooms ?? 0,
    baths: listing.bathrooms ?? 0,
    short: listing.badge ?? "",
    description: listing.description,
    images,
    featured: listing.featured,
    status: listing.isOffPlan ? "Off-plan" : "Ready",
    year: listing.yearBuilt ?? new Date(listing.createdAt).getFullYear(),
    amenities: listing.amenities,
    views: listing.viewCount,
    published: listing.status === "LIVE",
    details: { ...details, video: listing.media.find((media) => media.kind === "VIDEO_LINK" || media.kind === "VIDEO_UPLOAD")?.externalUrl ?? details.video ?? "" } as PropertyExtra,
  };
  if (listing.projectedYield) property.investment = { yield: Number.parseFloat(listing.projectedYield), label: listing.tier ?? "Investment ready" };
  return property;
}
