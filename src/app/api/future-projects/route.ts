import { FUTURE_PROJECT_STATUSES, type FutureProject } from "@/lib/future-projects";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.futureProject.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const projects: FutureProject[] = records.map((record) => ({
      id: record.id,
      name: record.name,
      region: record.region,
      status: FUTURE_PROJECT_STATUSES.includes(
        record.status as (typeof FUTURE_PROJECT_STATUSES)[number],
      )
        ? (record.status as FutureProject["status"])
        : "Announced",
      deadlineDate: record.deadlineDate?.toISOString().slice(0, 10) ?? "",
      deadlineNote: record.deadlineNote,
      budget: record.budget,
      text: record.text,
      image: record.image,
      imageAlt: record.imageAlt,
      published: record.published,
      order: record.sortOrder,
      latitude: record.latitude,
      longitude: record.longitude,
    }));
    return Response.json(projects, {
      headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" },
    });
  } catch (cause) {
    console.error("Public future projects query failed", cause);
    return Response.json(
      { error: "Future projects are temporarily unavailable." },
      { status: 503 },
    );
  }
}
