import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 25, 1),
      100
    );
    const cursor = searchParams.get("cursor");
    const q = searchParams.get("q")?.trim();

    const where: Prisma.SubscriberWhereInput = q
      ? { email: { contains: q, mode: "insensitive" } }
      : {};

    const [rows, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        take: limit + 1, // one extra row tells us whether another page exists
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      prisma.subscriber.count({ where }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      subscribers: page.map((s) => ({
        id: s.id,
        email: s.email,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (cause) {
    console.error("Admin subscribers GET error:", cause);

    return NextResponse.json(
      { error: "Failed to fetch subscribers." },
      { status: 500 }
    );
  }
}