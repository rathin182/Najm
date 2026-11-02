import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({ propertySlug: z.string().trim().min(1).max(200) });

// Public endpoint: counts one brochure download for the property.
// Feeds the "Brochure download" slice of the admin Enquiry sources chart.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { count } = await prisma.listing.updateMany({
      where: { slug: parsed.data.propertySlug },
      data: { brochureDownloads: { increment: 1 } },
    });
    // Sample/static properties aren't in the database, so there is nothing to count for them.
    return Response.json({ ok: true, counted: count > 0 });
  } catch (cause) {
    console.error("Recording brochure download failed", cause);
    return Response.json({ error: "Unable to record download." }, { status: 500 });
  }
}
