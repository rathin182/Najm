import type { AboutSection } from "@/lib/about-sections";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await prisma.aboutSection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const sections: AboutSection[] = records.map((record) => ({
      id: record.id,
      type: record.type as AboutSection["type"],
      title: record.title,
      description: record.description,
      image: record.image ?? "",
      imageAlt: record.imageAlt,
      buttonLabel: record.buttonLabel,
      buttonDestination: record.buttonDestination,
      items: Array.isArray(record.items) ? (record.items as AboutSection["items"]) : [],
      order: record.sortOrder,
    }));
    return Response.json(sections, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
    });
  } catch (cause) {
    console.error("Public About sections query failed", cause);
    return Response.json({ error: "About sections are temporarily unavailable." }, { status: 503 });
  }
}
