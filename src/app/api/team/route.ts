import type { TeamMember } from "@/lib/team";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const data: TeamMember[] = members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      image: member.image,
      imageAlt: member.imageAlt,
      joinedAt: member.joinedAt?.toISOString().slice(0, 10) ?? "",
      specialty: member.specialty,
      order: member.sortOrder,
    }));
    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
    });
  } catch (cause) {
    console.error("Public team query failed", cause);
    return Response.json({ error: "Team profiles are temporarily unavailable." }, { status: 503 });
  }
}
