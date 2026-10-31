import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED", "NOT_INTERESTED"]),
});

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const { id } = await params;
  try {
    const updated = await prisma.enquiry.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.enquiry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  }
}