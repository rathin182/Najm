import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("paginated") !== "1") {
    const listings = await prisma.listing.findMany({
      where: { status: "LIVE" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { position: "asc" } } },
    });
    return Response.json(listings.map(listingToProperty));
  }

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(30, Math.max(1, Number(searchParams.get("pageSize")) || 15));
  const where: Prisma.ListingWhereInput = { status: "LIVE" };
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const transaction = searchParams.get("transaction");
  const readiness = searchParams.get("readiness");
  const tier = searchParams.get("tier");
  const query = searchParams.get("q")?.trim();
  const minPrice = Number(searchParams.get("minPrice"));
  const maxPrice = Number(searchParams.get("maxPrice"));
  const minBeds = Number(searchParams.get("minBeds"));
  const minBaths = Number(searchParams.get("minBaths"));
  const minSize = Number(searchParams.get("minSize"));
  const maxSize = Number(searchParams.get("maxSize"));
  const minYield = Number(searchParams.get("minYield"));
  const extraConditions: Prisma.ListingWhereInput[] = [];

  if (city && city !== "all") where.city = city;
  if (type && type !== "all") {
    const category = ["residential", "commercial", "land"].includes(type.toLowerCase())
      ? type.toUpperCase() as "RESIDENTIAL" | "COMMERCIAL" | "LAND"
      : null;
    if (category) {
      extraConditions.push({ OR: [
        { propertyType: { equals: type, mode: "insensitive" } },
        { propertyType: null, category },
      ] });
    } else {
      where.propertyType = { equals: type, mode: "insensitive" };
    }
  }
  if (transaction === "buy") where.listingType = "SALE";
  if (transaction === "rent") where.listingType = "RENT";
  if (transaction === "commercial") where.category = "COMMERCIAL";
  if (readiness === "ready") where.isOffPlan = false;
  if (readiness === "off-plan") where.isOffPlan = true;
  if (tier && tier !== "all") where.tier = tier;
  if (Number.isFinite(minPrice) && minPrice > 0 || Number.isFinite(maxPrice) && maxPrice > 0) {
    where.price = {
      ...(Number.isFinite(minPrice) && minPrice > 0 ? { gte: BigInt(Math.floor(minPrice)) } : {}),
      ...(Number.isFinite(maxPrice) && maxPrice > 0 ? { lte: BigInt(Math.floor(maxPrice)) } : {}),
    };
  }
  if (Number.isFinite(minBeds) && minBeds > 0) where.bedrooms = { gte: minBeds };
  if (Number.isFinite(minBaths) && minBaths > 0) where.bathrooms = { gte: minBaths };
  if (Number.isFinite(minSize) && minSize > 0) {
    extraConditions.push({ OR: [
      { areaSqm: { gte: minSize } },
      { areaSqm: null, areaSqft: { gte: Math.ceil(minSize / 0.092903) } },
    ] });
  }
  if (Number.isFinite(maxSize) && maxSize > 0) {
    extraConditions.push({ OR: [
      { areaSqm: { lte: maxSize } },
      { areaSqm: null, areaSqft: { lte: Math.floor(maxSize / 0.092903) } },
    ] });
  }
  if (Number.isFinite(minYield) && minYield > 0) where.projectedYield = { gte: String(minYield) };
  if (query) {
    extraConditions.push({ OR: [
      { title: { contains: query, mode: "insensitive" } },
      { titleAr: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { locality: { contains: query, mode: "insensitive" } },
      { propertyType: { contains: query, mode: "insensitive" } },
      { badge: { contains: query, mode: "insensitive" } },
      { reraNumber: { contains: query, mode: "insensitive" } },
      { flags: { has: query } },
      { keyFeatures: { has: query } },
    ] });
  }
  if (extraConditions.length) where.AND = extraConditions;

  const sort = searchParams.get("sort");
  const orderBy: Prisma.ListingOrderByWithRelationInput[] = sort === "price-low"
    ? [{ price: "asc" }, { id: "asc" }]
    : sort === "price-high"
      ? [{ price: "desc" }, { id: "asc" }]
      : sort === "size-large"
        ? [{ areaSqm: "desc" }, { id: "asc" }]
        : sort === "name"
          ? [{ title: "asc" }, { id: "asc" }]
          : [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }];

  const [listings, total, cityOptions, typeOptions] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { media: { orderBy: { position: "asc" } } },
    }),
    prisma.listing.count({ where }),
    prisma.listing.findMany({ where: { status: "LIVE" }, select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
    prisma.listing.findMany({ where: { status: "LIVE", propertyType: { not: null } }, select: { propertyType: true }, distinct: ["propertyType"], orderBy: { propertyType: "asc" } }),
  ]);

  return Response.json({
    items: listings.map(listingToProperty),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    cities: cityOptions.map((item) => item.city),
    types: [...new Set([
      ...typeOptions.flatMap((item) => item.propertyType ? [item.propertyType] : []),
      "residential", "commercial", "land",
    ])].sort(),
  });
}
