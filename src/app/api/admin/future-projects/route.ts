import { z } from "zod";
import { FUTURE_PROJECT_STATUSES, type FutureProject } from "@/lib/future-projects";
import { guard } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const projectSchema = z
  .object({
    id: z.string().min(1).max(200).optional(),
    name: z.string().trim().min(1).max(100),
    region: z.string().trim().min(1).max(100),
    status: z.enum(FUTURE_PROJECT_STATUSES),
    deadlineDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.literal("")),
    deadlineNote: z.string().max(80),
    budget: z.number().finite().positive().nullable(),
    text: z.string().trim().min(1).max(260),
    image: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value)),
    imageAlt: z.string().max(140),
    published: z.boolean(),
    order: z.number().int().min(1),
    latitude: z.number().finite().min(-90).max(90).nullable(),
    longitude: z.number().finite().min(-180).max(180).nullable(),
  })
  .superRefine((project, context) => {
    if ((project.latitude === null) !== (project.longitude === null)) {
      context.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Both coordinates must be supplied together.",
      });
    }
  });

function toProject(record: {
  id: string;
  name: string;
  region: string;
  status: string;
  deadlineDate: Date | null;
  deadlineNote: string;
  budget: number | null;
  text: string;
  image: string;
  imageAlt: string;
  published: boolean;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
}): FutureProject {
  return {
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
  };
}

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const records = await prisma.futureProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(records.map(toProject));
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid future project data.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = parsed.data;
  const data = {
    name: project.name,
    region: project.region,
    status: project.status,
    deadlineDate: project.deadlineDate ? new Date(`${project.deadlineDate}T00:00:00.000Z`) : null,
    deadlineNote: project.deadlineNote,
    budget: project.budget,
    text: project.text,
    image: project.image,
    imageAlt: project.imageAlt,
    published: project.published,
    sortOrder: project.order,
    latitude: project.latitude,
    longitude: project.longitude,
  };

  try {
    const record = project.id
      ? await prisma.futureProject.upsert({
          where: { id: project.id },
          update: data,
          create: { id: project.id, ...data },
        })
      : await prisma.futureProject.create({ data });
    return Response.json(toProject(record));
  } catch (cause) {
    console.error("Future project save failed", cause);
    return Response.json({ error: "Could not save this future project." }, { status: 500 });
  }
}
