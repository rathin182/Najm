import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const select = { id: true, name: true, email: true, phone: true, type: true, city: true, notes: true, createdAt: true } as const;

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  type: z.enum(["BUYER", "INVESTOR", "SELLER", "TENANT"]).default("BUYER"),
  city: z.string().trim().max(80).default("Riyadh"),
  notes: z.string().trim().max(2000).default(""),
});

// export async function GET() {
//   const { error } = await guard(["ADMIN"]);
//   if (error) return error;
//   const items = await prisma.contact.findMany({ orderBy: { createdAt: "desc" }, take: 1000, select });
//   return NextResponse.json({ items: items.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })) });
// }
export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const items = await prisma.contact.findMany({ orderBy: { createdAt: "desc" }, take: 1000, select });
  const enquiries = await prisma.enquiry.findMany({
    where: {
      email: { in: items.map((c) => c.email) },
      OR: [{ listingId: { not: null } }, { propertyTitle: { not: null } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: { email: true, propertyTitle: true, listing: { select: { title: true } } },
  });
  const propertyByEmail = new Map<string, string>();
  for (const e of enquiries) {
    const title = e.listing?.title ?? e.propertyTitle;
    const key = e.email.trim().toLowerCase();
    if (title && title !== "General enquiry" && !propertyByEmail.has(key)) propertyByEmail.set(key, title);
  }
  return NextResponse.json({
    items: items.map((c) => ({ ...c, property: propertyByEmail.get(c.email.toLowerCase()) ?? null, createdAt: c.createdAt.toISOString() })),
  });
}

export async function POST(request: Request) {
  const { error, session } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  const d = parsed.data;
  const email = d.email.toLowerCase();
  try {
    const c = await prisma.contact.create({
      data: { name: d.name, email, phone: d.phone || null, type: d.type, city: d.city || "Riyadh", notes: d.notes, createdById: session?.user?.id ?? null },
      select,
    });
    return NextResponse.json({ ...c, createdAt: c.createdAt.toISOString() }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      const existing = await prisma.contact.findUnique({ where: { email }, select: { id: true } });
      return NextResponse.json({ error: "Already a contact.", id: existing?.id }, { status: 409 });
    }
    console.error("Create contact error:", e);
    return NextResponse.json({ error: "Could not save contact." }, { status: 500 });
  }
}