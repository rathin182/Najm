import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({ propertySlug: z.string().trim().min(1).max(200) });

// Public endpoint: records one property-page view for today (UTC day bucket)
// and bumps Listing.viewCount when the property exists in the database.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { propertySlug } = parsed.data;

  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  try {
    await Promise.all([
      prisma.listingViewDaily.upsert({
        where: { day_propertySlug: { day, propertySlug } },
        create: { day, propertySlug, views: 1 },
        update: { views: { increment: 1 } },
      }),
      prisma.listing.updateMany({ where: { slug: propertySlug }, data: { viewCount: { increment: 1 } } }),
    ]);
    return Response.json({ ok: true });
  } catch (cause) {
    console.error("Recording listing view failed", cause);
    return Response.json({ error: "Unable to record view." }, { status: 500 });
  }
}
