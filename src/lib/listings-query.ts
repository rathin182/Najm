import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";
import { Prisma } from "@/generated/prisma/client";
import { CATEGORY_TYPES } from "@/lib/property-categories";
import { CATEGORY_GROUPS } from "@/lib/home-search-options";

const getConfiguredTypes = unstable_cache(
  async () => prisma.homeSearchOption.findMany({
    where: { enabled: true, group: { in: [CATEGORY_GROUPS.residential, CATEGORY_GROUPS.commercial] } },
    orderBy: { position: "asc" },
    select: { group: true, value: true },
  }),
  ["listings:configured-types"],
  { revalidate: 60 },
);

const getFilterOptions = unstable_cache(
  async () => {
    const [cityOptions, typeOptions] = await Promise.all([
      prisma.listing.findMany({ where: { status: "LIVE" }, select: { city: true }, distinct: ["city"], orderBy: { city: "asc" } }),
      prisma.listing.findMany({ where: { status: "LIVE", propertyType: { not: null } }, select: { propertyType: true }, distinct: ["propertyType"], orderBy: { propertyType: "asc" } }),
    ]);
    return {
      cities: cityOptions.map((item) => item.city),
      types: [...new Set([
        ...typeOptions.flatMap((item) => item.propertyType ? [item.propertyType] : []),
        "residential", "commercial", "land",
      ])].sort(),
    };
  },
  ["listings:filter-options"],
  { revalidate: 60 },
);

export async function queryListingsPage(searchParams: URLSearchParams, isAdmin: boolean) {
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(30, Math.max(1, Number(searchParams.get("pageSize")) || 15));
    const where: Prisma.ListingWhereInput = isAdmin ? {} : { status: "LIVE" };
    // const city = searchParams.get("city");
    const cityFilters = [...new Set(searchParams.getAll("city").map((value) => value.trim()).filter((value) => value && value.toLowerCase() !== "all"))];
    const type = searchParams.get("type");
    const categoryFilter = searchParams.get("category");
    const transaction = searchParams.get("transaction");
    const readiness = searchParams.get("readiness");
    const tier = searchParams.get("tier");
    const query = searchParams.get("q")?.trim();
    const minPrice = Number(searchParams.get("minPrice"));
    const maxPrice = Number(searchParams.get("maxPrice"));
    const minBeds = Number(searchParams.get("minBeds"));
    const studioOnly = searchParams.get("studio") === "1";
    const minBaths = Number(searchParams.get("minBaths"));
    const minSize = Number(searchParams.get("minSize"));
    const maxSize = Number(searchParams.get("maxSize"));
    const minYield = Number(searchParams.get("minYield"));
    const extraConditions: Prisma.ListingWhereInput[] = [];
    const typesForCategory = async (category: "residential" | "commercial") => {
        const configured = (await getConfiguredTypes()).filter((item) => item.group === CATEGORY_GROUPS[category]).map((item) => item.value);
        return configured.length ? configured : [...CATEGORY_TYPES[category]];
    };

    // if (city && city !== "all") where.city = { equals: city, mode: "insensitive" };
    if (cityFilters.length) extraConditions.push({ OR: cityFilters.map((name) => ({ city: { equals: name, mode: "insensitive" as const } })) });
    if (type && type !== "all") {
    const category = ["residential", "commercial", "land"].includes(type.toLowerCase())
        ? type.toUpperCase() as "RESIDENTIAL" | "COMMERCIAL" | "LAND"
        : null;
    if (category) {
        extraConditions.push({ OR: [
        { propertyType: { equals: type, mode: "insensitive" } },
        { propertyType: null, category },
        ] });
    } else if (categoryFilter !== "residential" && categoryFilter !== "commercial") {
        where.propertyType = { equals: type, mode: "insensitive" };
    }
    }
    if (categoryFilter === "residential" || categoryFilter === "commercial") {
    const dbCategory = categoryFilter === "commercial" ? "COMMERCIAL" : "RESIDENTIAL";
        if (!type || type === "all") {
      const names = await typesForCategory(categoryFilter);
      extraConditions.push({ OR: [
        { category: dbCategory },
        ...names.map((name) => ({ propertyType: { equals: name, mode: "insensitive" as const } })),
      ] });
    } else {
        // where.category = dbCategory;
        where.propertyType = { equals: type, mode: "insensitive" };
    }
    }
    if (transaction === "buy") where.listingType = "SALE";
    if (transaction === "rent") where.listingType = "RENT";
    if (transaction === "commercial") where.category = "COMMERCIAL";
    if (readiness === "ready") where.isOffPlan = false;
    if (readiness === "off-plan") where.isOffPlan = true;

    const furnishingParam = searchParams.get("furnishing");
    const furnishingFilter = furnishingParam === "furnished" ? ["Fully furnished", "Furnished"] : furnishingParam === "semi" ? ["Semi furnished", "Semi-furnished"] : null;
    if (furnishingFilter) {
    extraConditions.push({ OR: furnishingFilter.map((value) => ({ details: { path: ["furnishing"], equals: value } })) });
    }

    if (tier && tier !== "all") where.tier = tier;
    if (Number.isFinite(minPrice) && minPrice > 0 || Number.isFinite(maxPrice) && maxPrice > 0) {
    where.price = {
        ...(Number.isFinite(minPrice) && minPrice > 0 ? { gte: BigInt(Math.floor(minPrice)) } : {}),
        ...(Number.isFinite(maxPrice) && maxPrice > 0 ? { lte: BigInt(Math.floor(maxPrice)) } : {}),
    };
    }
    if (studioOnly) where.bedrooms = 0;
    else if (Number.isFinite(minBeds) && minBeds > 0) where.bedrooms = { gte: minBeds };
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
    const areaMinParam = Math.round(Number(searchParams.get("areaMin")));
    const areaMaxParam = Math.round(Number(searchParams.get("areaMax")));
    let areaMin = Number.isFinite(areaMinParam) && areaMinParam > 0 ? areaMinParam : 0;
    let areaMax = Number.isFinite(areaMaxParam) && areaMaxParam > 0 ? areaMaxParam : 0;
    if (areaMin && areaMax && areaMin > areaMax) [areaMin, areaMax] = [areaMax, areaMin];
    // Cards show areaSqm, or round(areaSqft x 0.092903) when areaSqm is empty - filter on that same number.
    if (areaMin) {
    extraConditions.push({ OR: [{ areaSqm: { gte: areaMin } }, { areaSqm: null, areaSqft: { gte: Math.ceil((areaMin - 0.5) / 0.092903) } }] });
    }
    if (areaMax) {
    extraConditions.push({ OR: [{ areaSqm: { lte: areaMax } }, { areaSqm: null, areaSqft: { lt: Math.ceil((areaMax + 0.5) / 0.092903) } }] });
    }
    // const categoryParam = searchParams.get("category");
    // if (categoryParam === "residential" || categoryParam === "commercial") {
    //   extraConditions.push({ OR: [
    //     { category: categoryParam === "commercial" ? "COMMERCIAL" : "RESIDENTIAL" },
    //     ...CATEGORY_TYPES[categoryParam].map((name) => ({ propertyType: { equals: name, mode: "insensitive" as const } })),
    //   ] });
    // }
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
    const orderBy: Prisma.ListingOrderByWithRelationInput[] =
      sort === "price-low" ? [{ price: "asc" }, { id: "asc" }]
      : sort === "price-high" ? [{ price: "desc" }, { id: "asc" }]
      : sort === "size-large" ? [{ areaSqm: { sort: "desc", nulls: "last" } }, { id: "asc" }]
      : sort === "size-small" ? [{ areaSqm: { sort: "asc", nulls: "last" } }, { id: "asc" }]
      : sort === "name" ? [{ title: "asc" }, { id: "asc" }]
      : sort === "oldest" ? [{ publishedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      : [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    const [listings, total, { cities, types }] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { media: { where: { kind: "IMAGE", status: "READY" }, orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.listing.count({ where }),
    getFilterOptions(),
  ]);

  return { items: listings.map(listingToProperty), total, page, pageSize, hasMore: page * pageSize < total, cities, types };
}