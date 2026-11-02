import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED", "NOT_INTERESTED"] as const;
type Status = (typeof STATUSES)[number];
const GENERAL_ENQUIRY_LABEL = "Home contact form";
const MANDATE_LABEL: Record<string, string> = {
  "contact-page": "Contact page",
  "home-faq": "Home FAQ",
};
const mandateLabel = (source: string | null) =>
  source ? (MANDATE_LABEL[source] ?? source.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase())) : "Contact page";

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  try {
    const [statusRows, sourceRows, mandateRows, brochureCount, views, portfolio, recentRows, topRows, cityRows] = await Promise.all([
      prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.enquiry.groupBy({
        by: ["source"],
        where: { OR: [{ source: null }, { source: { not: "property-page" } }] },
        _count: { _all: true },
      }),
      prisma.acquisitionMandate.groupBy({ by: ["source"], _count: { _all: true } }),
      prisma.listing.aggregate({ _sum: { brochureDownloads: true } }),
      prisma.listing.aggregate({ _sum: { viewCount: true } }),
      prisma.listing.aggregate({ where: { status: "LIVE" }, _sum: { price: true } }),
      prisma.enquiry.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 6,
        select: { id: true, name: true, message: true, status: true, createdAt: true },
      }),
      // Most viewed properties: top 5 by Listing.viewCount, with cover image
      prisma.listing.findMany({
        orderBy: [{ viewCount: "desc" }, { id: "asc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          media: { where: { kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1, select: { externalUrl: true, storageKey: true } },
        },
      }),
      // Listings by city: views per city (summed across that city's listings)
      prisma.listing.groupBy({ by: ["city"], _sum: { viewCount: true } }),
    ]);

    const pipeline = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
    let total = 0;
    for (const r of statusRows) {
      pipeline[r.status as Status] = r._count._all;
      total += r._count._all;
    }

    // Conversion: share of enquiries that have moved on from NEW to CONTACTED or CLOSED
    const converted = pipeline.CONTACTED + pipeline.CLOSED;
    const conversionRate = total ? Math.round((converted / total) * 100) : 0;

    // Enquiry sources: general enquiries (everything except property-page) + mandate forms by source
    const sourceTotals = new Map<string, number>();
    const add = (name: string, n: number) => sourceTotals.set(name, (sourceTotals.get(name) ?? 0) + n);
    for (const r of sourceRows) add(GENERAL_ENQUIRY_LABEL, r._count._all);
    for (const r of mandateRows) add(mandateLabel(r.source), r._count._all);
    add("Brochure download", brochureCount._sum.brochureDownloads ?? 0);
    const sources = [...sourceTotals].map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value);

    // Cities ranked by total views, highest first (ties broken alphabetically)
    const byCity = cityRows
      .map((r) => ({ name: r.city, value: r._sum.viewCount ?? 0 }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

    return Response.json({
      pipeline,
      totalEnquiries: total,
      totalViews: views._sum.viewCount ?? 0,
      portfolioValue: Number(portfolio._sum.price ?? BigInt(0)),
      conversionRate,
      sources,
      byCity,
      recentEnquiries: recentRows.map((e) => ({
        id: e.id,
        name: e.name,
        message: e.message,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      })),
      topViewed: topRows.map((l) => ({
        id: l.id,
        title: l.title,
        views: l.viewCount,
        image: l.media[0]?.externalUrl ?? l.media[0]?.storageKey ?? null,
      })),
    });
  } catch (cause) {
    console.error("Admin dashboard stats failed", cause);
    return Response.json({ error: "Unable to load dashboard stats." }, { status: 500 });
  }
}