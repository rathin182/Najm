import { z } from "zod";
import { Prisma, type ListingType, type PropertyCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import { listingToProperty } from "@/lib/listing-property";

const pair = z.tuple([z.string(), z.string()]);
const propertySchema = z.object({
  id: z.string().min(1).max(200), title: z.string().trim().min(1).max(200), city: z.string().trim().min(1).max(100), district: z.string().trim().max(150),
  type: z.string().trim().min(1).max(100), price: z.number().int().positive(), area: z.number().positive(), beds: z.number().int().nonnegative(), baths: z.number().int().nonnegative(),
  short: z.string().max(500), description: z.string().max(20000), images: z.array(z.string().url().or(z.string().startsWith("/"))).min(1).max(50),
  featured: z.boolean().optional(), investment: z.object({ yield: z.number().nonnegative(), label: z.string().max(120) }).optional(), status: z.enum(["Ready", "Off-plan"]), year: z.number().int().min(1800).max(2200),
  amenities: z.array(z.string().max(100)).max(100), views: z.number().int().nonnegative().optional(), published: z.boolean(), details: z.object({
    plot: z.number().nonnegative(), floors: z.string().max(100), parking: z.number().nonnegative(), furnishing: z.string().max(80), facing: z.string().max(80), developer: z.string().max(200), deed: z.string().max(200), lat: z.number(), lng: z.number(), serviceCharge: z.number().nonnegative(), handover: z.string().max(50), video: z.string().max(2000), rooms: z.array(pair), nearby: z.array(pair), plan: z.array(pair), features: z.array(z.string().max(100)), agentName: z.string().max(200), agentPhone: z.string().max(80), seoTitle: z.string().max(200), seoDescription: z.string().max(500),
  }).optional(),
}).superRefine((property, context) => {
  for (const image of property.images) {
    if (image.startsWith("/") && !image.startsWith("/properties/uploads/")) context.addIssue({ code: "custom", path: ["images"], message: "Property photos must use the property uploads directory." });
  }
  if (property.details?.video.startsWith("/") && !property.details.video.startsWith("/properties/uploads/")) context.addIssue({ code: "custom", path: ["details", "video"], message: "Uploaded video must use the property uploads directory." });
});

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const listings = await prisma.listing.findMany({ orderBy: { updatedAt: "desc" }, include: { media: { orderBy: { position: "asc" } } } });
  return Response.json(listings.map(listingToProperty));
}

export async function POST(request: Request) {
  const { error, session } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = propertySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid property data.", issues: parsed.error.flatten() }, { status: 400 });
  const p = parsed.data;
  const category: PropertyCategory = p.type.toLowerCase().includes("commercial") || ["office", "shop", "showroom", "warehouse", "industrial building", "business center", "restaurant / cafe", "co-working space"].includes(p.type.toLowerCase()) ? "COMMERCIAL" : p.type.toLowerCase().includes("land") || p.type.toLowerCase().includes("plot") ? "LAND" : "RESIDENTIAL";
  const listingType: ListingType = "SALE";
  const requestedSlug = slugify(p.id || p.title) || `property-${Date.now()}`;
  const slug = await prisma.listing.findFirst({ where: { slug: requestedSlug, ownerId: { not: session!.user.id } }, select: { id: true } }).then((conflict) => conflict ? `${requestedSlug}-${slugify(p.title).slice(0, 24) || "listing"}` : requestedSlug);
  const media = [...p.images.map((url, position) => ({ kind: "IMAGE" as const, externalUrl: url, position, isCover: position === 0, status: "READY" as const })), ...(p.details?.video ? [{ kind: p.details.video.startsWith("/") ? "VIDEO_UPLOAD" as const : "VIDEO_LINK" as const, externalUrl: p.details.video, position: p.images.length, isCover: false, status: "READY" as const }] : [])];
  const details = { ...(p.details ?? {}), short: p.short, serviceCharge: p.details?.serviceCharge ?? 0, paymentPlan: p.details?.plan ?? [], state: "Sale" };
  const data = {
    ownerId: session!.user.id, slug, title: p.title, description: p.description || p.short, listingType, category, propertyType: p.type,
    price: BigInt(p.price), featured: !!p.featured, bedrooms: p.beds, bathrooms: p.baths, furnished: p.details?.furnishing.toLowerCase().includes("furnished") ?? false,
    floors: Number.parseInt(p.details?.floors ?? "", 10) || null, yearBuilt: p.year, areaSqm: Math.round(p.area), locality: p.district || null, city: p.city, state: "Saudi Arabia",
    latitude: p.details?.lat ?? null, longitude: p.details?.lng ?? null, isOffPlan: p.status === "Off-plan", amenities: p.amenities, keyFeatures: p.details?.features ?? [],
    projectedYield: p.investment ? String(p.investment.yield) : null, tier: p.investment?.label ?? null, badge: p.short || null, details,
    status: p.published ? "LIVE" as const : "DRAFT" as const, publishedAt: p.published ? new Date() : null,
  };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.listing.findUnique({ where: { slug }, select: { id: true } });
      const listingData = { ...data, details: data.details as Prisma.InputJsonValue };
      const listing = existing
        ? await tx.listing.update({ where: { slug }, data: listingData })
        : await tx.listing.create({ data: listingData });
      await tx.listingMedia.deleteMany({ where: { listingId: listing.id } });
      if (media.length) await tx.listingMedia.createMany({ data: media.map((item) => ({ ...item, listingId: listing.id })) });
      return tx.listing.findUniqueOrThrow({ where: { id: listing.id }, include: { media: { orderBy: { position: "asc" } } } });
    });
    return Response.json(listingToProperty(result));
  } catch (cause) {
    console.error("Admin listing save failed", cause);
    return Response.json({ error: "Could not save this property." }, { status: 500 });
  }
}
