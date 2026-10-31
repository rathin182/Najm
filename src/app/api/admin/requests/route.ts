import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const STATUSES = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "CLOSED",
  "NOT_INTERESTED",
] as const;

type Status = (typeof STATUSES)[number];

async function getCounts() {
  const rows = await prisma.enquiry.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });

  const counts: Record<"All" | Status, number> = {
    All: 0,
    NEW: 0,
    CONTACTED: 0,
    VISIT_SCHEDULED: 0,
    CLOSED: 0,
    NOT_INTERESTED: 0,
  };

  for (const r of rows) {
    counts[r.status as Status] = r._count._all;
    counts.All += r._count._all;
  }

  return counts;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = request.nextUrl.searchParams;

    const type = params.get("type");
    const cursorId = params.get("cursorId");
    const cursorDate = params.get("cursorDate");

    // Return enquiry counts only
    if (type === "counts") {
      return NextResponse.json({
        counts: await getCounts(),
      });
    }

    // Validate request type
    if (type !== "property" && type !== "mandates") {
      return NextResponse.json(
        { error: "Invalid request type." },
        { status: 400 }
      );
    }

    // Validate pagination cursor
    if ((cursorId && !cursorDate) || (!cursorId && cursorDate)) {
      return NextResponse.json(
        { error: "Invalid pagination cursor." },
        { status: 400 }
      );
    }

    const cursorCreatedAt = cursorDate ? new Date(cursorDate) : null;

    if (
      cursorCreatedAt &&
      Number.isNaN(cursorCreatedAt.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid cursor date." },
        { status: 400 }
      );
    }

    // ==========================================
    // PROPERTY ENQUIRIES
    // ==========================================

    if (type === "property") {
      const status = params.get("status");

      if (
        status &&
        !(STATUSES as readonly string[]).includes(status)
      ) {
        return NextResponse.json(
          { error: "Invalid status." },
          { status: 400 }
        );
      }

      const q = params.get("q")?.trim().slice(0, 100);

      const filters: object[] = [];

      if (status) {
        filters.push({
          status: status as Status,
        });
      }

      if (q) {
        filters.push({
          OR: [
            {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              message: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              propertyTitle: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        });
      }

      if (cursorId && cursorCreatedAt) {
        filters.push({
          OR: [
            {
              createdAt: {
                lt: cursorCreatedAt,
              },
            },
            {
              createdAt: cursorCreatedAt,
              id: {
                lt: cursorId,
              },
            },
          ],
        });
      }

      const items = await prisma.enquiry.findMany({
        where: filters.length
          ? {
              AND: filters,
            }
          : {},

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        take: PAGE_SIZE + 1,

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          investorType: true,
          status: true,
          source: true,
          createdAt: true,
          propertyTitle: true,
          propertySlug: true,

          listing: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      });

      const hasMore = items.length > PAGE_SIZE;

      const pageItems = items.slice(0, PAGE_SIZE);

      const lastItem = pageItems[pageItems.length - 1];

      return NextResponse.json({
        items: pageItems.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          message: item.message,
          investorType: item.investorType,
          status: item.status,
          source: item.source,
          createdAt: item.createdAt.toISOString(),

          propertyTitle:
            item.listing?.title ?? item.propertyTitle,

          propertySlug:
            item.listing?.slug ?? item.propertySlug,
        })),

        hasMore,

        counts: cursorId ? undefined : await getCounts(),

        nextCursor:
          hasMore && lastItem
            ? {
                id: lastItem.id,
                createdAt: lastItem.createdAt.toISOString(),
              }
            : null,
      });
    }

    // ==========================================
    // ACQUISITION MANDATES
    // ==========================================

    // Build where condition without explicitly passing undefined.
    const mandateWhere =
      cursorId && cursorCreatedAt
        ? {
            OR: [
              {
                createdAt: {
                  lt: cursorCreatedAt,
                },
              },
              {
                createdAt: cursorCreatedAt,
                id: {
                  lt: cursorId,
                },
              },
            ],
          }
        : {};

    const items = await prisma.acquisitionMandate.findMany({
      where: mandateWhere,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      take: PAGE_SIZE + 1,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        investorType: true,
        allocationTier: true,
        region: true,
        message: true,
        source: true,
        status: true,
        createdAt: true,
      },
    });

    const hasMore = items.length > PAGE_SIZE;

    const pageItems = items.slice(0, PAGE_SIZE);

    const lastItem = pageItems[pageItems.length - 1];

    return NextResponse.json({
      items: pageItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),

      hasMore,

      nextCursor:
        hasMore && lastItem
          ? {
              id: lastItem.id,
              createdAt: lastItem.createdAt.toISOString(),
            }
          : null,
    });
  } catch (error) {
    console.error(
      "Admin requests pagination error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load requests.",
      },
      {
        status: 500,
      }
    );
  }
}