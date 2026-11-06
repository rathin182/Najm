import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import { listingToProperty } from "@/lib/listing-property";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => null) as { published?: unknown } | null;
  if (!body || typeof body.published !== "boolean") return Response.json({ error: "Invalid listing update." }, { status: 400 });
  const listing = await prisma.listing.findUnique({ where: { slug: id }, include: { media: { orderBy: { position: "asc" } } } });
  if (!listing) return Response.json({ error: "Listing not found." }, { status: 404 });
  const updated = await prisma.listing.update({ where: { id: listing.id }, data: { status: body.published ? "LIVE" : "DRAFT", publishedAt: body.published ? listing.publishedAt ?? new Date() : null }, include: { media: { orderBy: { position: "asc" } } } });
  return Response.json(listingToProperty(updated));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const result = await prisma.listing.deleteMany({ where: { slug: id } });
  return result.count ? new Response(null, { status: 204 }) : Response.json({ error: "Listing not found." }, { status: 404 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { slug: id }, include: { media: { orderBy: { position: "asc" } } } });
  return listing ? Response.json(listingToProperty(listing)) : Response.json({ error: "Listing not found." }, { status: 404 });
}