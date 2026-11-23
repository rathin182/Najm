import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const locationSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  featured: z.boolean().default(false),
  image: z.string().trim().max(2000).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

function serializeLocation(location: { id: string; name: string; featured: boolean; image: string | null; sortOrder: number }) {
  return { ...location };
}

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const locations = await prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json(locations.map(serializeLocation), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = locationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a location name and valid location details." }, { status: 400 });
  }

  const { id, name, featured, image, sortOrder } = parsed.data;
  try {
    const saved = await prisma.$transaction(async (tx) => {
      const existing = id ? await tx.location.findUnique({ where: { id } }) : null;
      if (id && !existing) throw new Error("LOCATION_NOT_FOUND");
      if (existing && existing.name !== name) {
        await tx.listing.updateMany({
          where: { city: { equals: existing.name, mode: "insensitive" } },
          data: { city: name },
        });
      }
      const nextOrder = sortOrder ?? (existing?.sortOrder ?? await tx.location.count());
      return existing
        ? tx.location.update({ where: { id: existing.id }, data: { name, featured, image: image || null, sortOrder: nextOrder } })
        : tx.location.create({ data: { name, featured, image: image || null, sortOrder: nextOrder } });
    });
    return NextResponse.json(serializeLocation(saved));
  } catch (cause) {
    const code = (cause as { code?: string }).code;
    if (cause instanceof Error && cause.message === "LOCATION_NOT_FOUND") {
      return NextResponse.json({ error: "This location no longer exists. Reload and try again." }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json({ error: "A location with this name already exists." }, { status: 409 });
    }
    console.error("Save location failed:", cause);
    return NextResponse.json({ error: "Could not save this location." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A location ID is required." }, { status: 400 });

  try {
    await prisma.location.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (cause) {
    if ((cause as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "This location no longer exists." }, { status: 404 });
    }
    console.error("Delete location failed:", cause);
    return NextResponse.json({ error: "Could not delete this location." }, { status: 500 });
  }
}
