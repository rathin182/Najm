import { z } from "zod";
import type { TeamMember } from "@/lib/team";
import { guard } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const teamSchema = z.object({
  id: z.string().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  image: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value)),
  imageAlt: z.string().trim().max(140),
  joinedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  specialty: z.string().trim().max(160),
  order: z.number().int().min(1),
});

function toTeamMember(record: {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  imageAlt: string;
  joinedAt: Date | null;
  specialty: string;
  sortOrder: number;
}): TeamMember {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    bio: record.bio,
    image: record.image,
    imageAlt: record.imageAlt,
    joinedAt: record.joinedAt?.toISOString().slice(0, 10) ?? "",
    specialty: record.specialty,
    order: record.sortOrder,
  };
}

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const members = await prisma.teamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(members.map(toTeamMember));
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = teamSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid team member details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const member = parsed.data;
  const data = {
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: member.image,
    imageAlt: member.imageAlt || member.name,
    joinedAt: member.joinedAt ? new Date(`${member.joinedAt}T00:00:00.000Z`) : null,
    specialty: member.specialty,
    sortOrder: member.order,
  };
  try {
    const record = member.id
      ? await prisma.teamMember.upsert({
          where: { id: member.id },
          update: data,
          create: { id: member.id, ...data },
        })
      : await prisma.teamMember.create({ data });
    return Response.json(toTeamMember(record));
  } catch (cause) {
    console.error("Team member save failed", cause);
    return Response.json({ error: "Could not save this team member." }, { status: 500 });
  }
}
