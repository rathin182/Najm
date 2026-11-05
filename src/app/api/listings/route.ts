import { prisma } from "@/lib/prisma";
import { listingToProperty } from "@/lib/listing-property";
import { auth } from "@/lib/auth";
import { queryListingsPage } from "@/lib/listings-query";

export const dynamic = "force-dynamic";

// Public data can be cached briefly. Admin responses include drafts, so they must never be shared.
const PUBLIC_CACHE = "public, max-age=30, s-maxage=60, stale-while-revalidate=300";
const cacheHeaders = (isAdmin: boolean) => ({ "Cache-Control": isAdmin ? "private, no-store" : PUBLIC_CACHE });

export async function GET(request: Request) {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const { searchParams } = new URL(request.url);
  if (searchParams.get("paginated") !== "1") {
    const listings = await prisma.listing.findMany({
      where: isAdmin ? {} : { status: "LIVE" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { position: "asc" } } },
    });
    // return Response.json(listings.map(listingToProperty));
    return Response.json(listings.map(listingToProperty), { headers: cacheHeaders(isAdmin) });
  }

  const data = await queryListingsPage(searchParams, isAdmin);
  return Response.json(data, { headers: cacheHeaders(isAdmin) });
}
