import { z } from "zod";
import { guard } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const agentSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120).default("Property Advisor"),
  age: z.number().int().min(18).max(100),
  experienceYears: z.number().int().min(0).max(80),
  review: z.number().min(0).max(5).refine((value) => Number.isInteger(value * 10), "Use up to one decimal place.").nullable().optional(),
  verified: z.boolean().default(false),
  phone: z.string().trim().min(1).max(40),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(1).max(300),
  description: z.string().trim().max(1000).nullable().optional(),
  image: z.string().trim().max(2000).nullable().optional(),
});

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  try {
    const agents = await prisma.agent.findMany({ orderBy: [{ name: "asc" }, { createdAt: "asc" }] });
    return Response.json(agents, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Load agents failed:", cause);
    return Response.json({ error: "Could not load agents. Apply the pending database migrations and try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = agentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter valid agent details.", issues: parsed.error.flatten() }, { status: 400 });
  const { id } = parsed.data;
  const data = {
    name: parsed.data.name,
    role: parsed.data.role,
    age: parsed.data.age,
    experienceYears: parsed.data.experienceYears,
    review: parsed.data.review ?? null,
    verified: parsed.data.verified,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp ?? null,
    email: parsed.data.email,
    address: parsed.data.address,
    description: parsed.data.description ?? null,
    image: parsed.data.image ?? null,
  };
  try {
    const agent = id
      ? await prisma.agent.update({ where: { id }, data })
      : await prisma.agent.create({ data });
    return Response.json(agent);
  } catch (cause) {
    const code = (cause as { code?: string }).code;
    if (code === "P2025") return Response.json({ error: "This agent no longer exists." }, { status: 404 });
    console.error("Save agent failed:", cause);
    return Response.json({ error: "Could not save this agent." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "An agent ID is required." }, { status: 400 });
  try {
    await prisma.agent.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (cause) {
    if ((cause as { code?: string }).code === "P2025") return Response.json({ error: "This agent no longer exists." }, { status: 404 });
    console.error("Delete agent failed:", cause);
    return Response.json({ error: "Could not delete this agent." }, { status: 500 });
  }
}
