import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(5).max(40),
  message: z.string().trim().max(2000).optional(),
  investorType: z.string().trim().max(80).optional(),
  propertySlug: z.string().trim().min(1).max(200),
  propertyTitle: z.string().trim().max(200).optional(),
  source: z.enum(["property-page", "home-modal"]).default("property-page"),
});

// Public endpoint: guests can request a private dossier / tour for a property.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  const data = parsed.data;

  // Link to the real listing when it exists; sample properties are stored by slug/title only.
  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({ where: { slug: data.propertySlug }, select: { id: true, title: true } }),
    auth().catch(() => null),
  ]);

  const enquiry = await prisma.enquiry.create({
    data: {
      listingId: listing?.id ?? null,
      senderId: session?.user?.id ?? null,
      name: data.name,
      email: data.email || session?.user?.email || "not-provided@guest.local",
      phone: data.phone,
      message: data.message || `Private ${data.source === "home-modal" ? "tour & floorplans" : "dossier"} request`,
      investorType: data.investorType || null,
      propertySlug: data.propertySlug,
      propertyTitle: listing?.title ?? data.propertyTitle ?? null,
      source: data.source,
    },
    select: { id: true },
  });

  return Response.json({ ok: true, id: enquiry.id }, { status: 201 });
}