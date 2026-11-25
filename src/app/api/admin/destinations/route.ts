import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const destinationSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  image: z.string().trim().min(1).max(2000),
  description: z.string().trim().min(1).max(500),
});

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  try {
    const rows = await prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, image: true, description: true } });
    return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    const code = (cause as { code?: string }).code;
    console.error("Load destinations failed:", cause);
    return NextResponse.json({ error: code === "P2021" ? "The Destinations table is missing. Apply the pending database migration with `npx prisma migrate deploy`." : "Could not load destinations from the database." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = destinationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a destination name and valid details." }, { status: 400 });
  const { id, name, image, description } = parsed.data;
  try {
    const destination = id
      ? await prisma.destination.update({ where: { id }, data: { name, image, description } })
      : await prisma.destination.create({ data: { name, image, description } });
    return NextResponse.json({ id: destination.id, name: destination.name, image: destination.image, description: destination.description });
  } catch (cause) {
    const code = (cause as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "A destination with this name already exists." }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "This destination no longer exists." }, { status: 404 });
    console.error("Save destination failed:", cause);
    return NextResponse.json({ error: "Could not save this destination." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A destination ID is required." }, { status: 400 });
  try {
    await prisma.destination.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (cause) {
    if ((cause as { code?: string }).code === "P2025") return NextResponse.json({ error: "This destination no longer exists." }, { status: 404 });
    console.error("Delete destination failed:", cause);
    return NextResponse.json({ error: "Could not delete this destination." }, { status: 500 });
  }
}
