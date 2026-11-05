import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({ propertySlug: z.string().trim().min(1).max(200) });

// A property detail page calls this once when it is opened. It records both
// the lifetime count and the UTC daily bucket used by the admin dashboard.
export async function GET(request: Request) {
  const parsed = schema.safeParse({ propertySlug: new URL(request.url).searchParams.get("propertySlug") });
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { propertySlug } = parsed.data;

  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  try {
    // const result = await prisma.$transaction(async (tx) => {
    //   const listing = await tx.listing.findFirst({ where: { slug: propertySlug, status: "LIVE" }, select: { id: true } });
    //   if (!listing) return false;

    //   await tx.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } });
    //   await tx.listingViewDaily.upsert({
    //     where: { day_propertySlug: { day, propertySlug } },
    //     create: { day, propertySlug, views: 1 },
    //     update: { views: { increment: 1 } },
    //   });
    //   return true;
    // });
    // if (!result) return Response.json({ error: "Property not found." }, { status: 404 });
    // return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
        // One conditional UPDATE replaces findFirst + update; count 0 means unknown or not LIVE.
    const { count } = await prisma.listing.updateMany({
      where: { slug: propertySlug, status: "LIVE" },
      data: { viewCount: { increment: 1 } },
    });
    if (count === 0) return Response.json({ error: "Property not found." }, { status: 404 });
    await prisma.listingViewDaily.upsert({
      where: { day_propertySlug: { day, propertySlug } },
      create: { day, propertySlug, views: 1 },
      update: { views: { increment: 1 } },
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (cause) {
    console.error("Recording listing view failed", cause);
    return Response.json({ error: "Unable to record view." }, { status: 500 });
  }
}
