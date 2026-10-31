import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const select = { id: true, name: true, email: true, phone: true, type: true, city: true, notes: true, createdAt: true } as const;

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  type: z.enum(["BUYER", "INVESTOR", "SELLER", "TENANT"]),
  city: z.string().trim().max(80),
  notes: z.string().trim().max(2000),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  const d = parsed.data;
  const { id } = await params;
  try {
    const c = await prisma.contact.update({
      where: { id },
      data: { name: d.name, email: d.email.toLowerCase(), phone: d.phone || null, type: d.type, city: d.city || "Riyadh", notes: d.notes },
      select,
    });
    return NextResponse.json({ ...c, createdAt: c.createdAt.toISOString() });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "Another contact already uses that email." }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    console.error("Update contact error:", e);
    return NextResponse.json({ error: "Could not update contact." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }
}