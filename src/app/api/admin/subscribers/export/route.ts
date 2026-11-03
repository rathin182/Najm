import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// Guard against spreadsheet formula injection, then quote the cell.
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const cell = (v: string) => `"${safe(v).replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const q = new URL(request.url).searchParams.get("q")?.trim();
  const where: Prisma.SubscriberWhereInput = q
    ? { email: { contains: q, mode: "insensitive" } }
    : {};

  const subscribers = await prisma.subscriber.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const rows = [
    ["Email", "Subscribed"],
    ...subscribers.map((s) => [s.email, s.createdAt.toISOString()]),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="najm-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}