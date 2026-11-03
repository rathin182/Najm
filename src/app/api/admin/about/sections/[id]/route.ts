import { guard } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const { id } = await params;
  try {
    const result = await prisma.aboutSection.deleteMany({ where: { id, type: { not: "TEAM" } } });
    return result.count
      ? new Response(null, { status: 204 })
      : Response.json({ error: "Hero section not found." }, { status: 404 });
  } catch (cause) {
    console.error("About section delete failed", cause);
    return Response.json({ error: "Could not delete this About section." }, { status: 500 });
  }
}
