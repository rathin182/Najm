import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const LABEL = { BUYER: "Buyer", INVESTOR: "Investor", SELLER: "Seller", TENANT: "Tenant" } as const;
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const cell = (v: string) => `"${safe(v).replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const type = new URL(request.url).searchParams.get("type");
  const where = type && type in LABEL ? { type: type as keyof typeof LABEL } : undefined;

  const contacts = await prisma.contact.findMany({ where, orderBy: { createdAt: "desc" } });
  const rows = [
    ["Name", "Email", "Phone", "Type", "City", "Notes", "Added"],
    ...contacts.map((c) => [c.name, c.email, c.phone ?? "", LABEL[c.type], c.city, c.notes, c.createdAt.toISOString()]),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="najm-contacts.csv"',
      "Cache-Control": "no-store",
    },
  });
}