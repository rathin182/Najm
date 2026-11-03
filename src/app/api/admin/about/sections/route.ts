import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ABOUT_HERO_DESTINATIONS, type AboutSection, type AboutSectionItem, } from "@/lib/about-sections";
import { guard } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { planOrderShifts } from "@/lib/reorder";

const destinations: readonly string[] = ABOUT_HERO_DESTINATIONS.map(
  (destination) => destination.value,
);
const addableTypes = ["HERO_IMAGE", "VALUE_CARDS", "JOURNEY_TIMELINE", "CTA_BANNER"] as const;
const itemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
});
const sectionSchema = z
  .object({
    id: z.string().min(1).max(200).optional(),
    type: z.enum(addableTypes),
    title: z.string().trim().max(160),
    description: z.string().trim().max(2000),
    image: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value)),
    imageAlt: z.string().trim().max(140),
    buttonLabel: z.string().trim().max(80),
    buttonDestination: z.string().refine((value) => destinations.includes(value)),
    items: z.array(itemSchema).max(30),
    order: z.number().int().min(1),
  })
  .superRefine((section, context) => {
    const addIssue = (
      path: "title" | "description" | "image" | "items" | "buttonDestination",
      message: string,
    ) => {
      context.addIssue({ code: "custom", path: [path], message });
    };
    if (section.type === "HERO_IMAGE") {
      if (!section.image) addIssue("image", "Choose an image for the hero section.");
      if (!section.title && !section.description)
        addIssue("title", "Add a heading or description.");
    }
    if (section.type === "VALUE_CARDS" || section.type === "JOURNEY_TIMELINE") {
      if (!section.title) addIssue("title", "Add a section heading.");
      if (section.items.length === 0) addIssue("items", "Add at least one item to this section.");
    }
    if (section.type === "CTA_BANNER") {
      if (!section.title) addIssue("title", "Add a heading to the call-to-action section.");
      if (!section.buttonDestination) addIssue("buttonDestination", "Choose a button destination.");
    }
    if (section.buttonDestination && !section.buttonLabel) {
      context.addIssue({
        code: "custom",
        path: ["buttonLabel"],
        message: "Add a button label or choose no button.",
      });
    }
  });

function toAboutSection(record: {
  id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  buttonLabel: string;
  buttonDestination: string;
  items: unknown;
  sortOrder: number;
}): AboutSection {
  return {
    id: record.id,
    type: record.type as AboutSection["type"],
    title: record.title,
    description: record.description,
    image: record.image ?? "",
    imageAlt: record.imageAlt,
    buttonLabel: record.buttonLabel,
    buttonDestination: record.buttonDestination,
    items: Array.isArray(record.items) ? (record.items as AboutSectionItem[]) : [],
    order: record.sortOrder,
  };
}

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const sections = await prisma.aboutSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return Response.json(sections.map(toAboutSection));
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = sectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid About section details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const section = parsed.data;
  const data = {
    type: section.type,
    title: section.title,
    description: section.description,
    image: section.image || null,
    imageAlt: section.imageAlt || section.title,
    buttonLabel: section.buttonDestination ? section.buttonLabel : "",
    buttonDestination: section.buttonDestination,
    items: section.items as Prisma.InputJsonValue,
    sortOrder: section.order,
  };
  try {
    const record = await prisma.$transaction(async (tx) => {
      const previous = section.id
        ? await tx.aboutSection.findUnique({ where: { id: section.id }, select: { sortOrder: true } })
        : null;
      const others = await tx.aboutSection.findMany({
        where: section.id ? { id: { not: section.id } } : {},
        select: { id: true, sortOrder: true },
      });
      for (const shift of planOrderShifts(others, section.order, previous?.sortOrder ?? null)) {
        await tx.aboutSection.update({ where: { id: shift.id }, data: { sortOrder: shift.sortOrder } });
      }
      return section.id
        ? tx.aboutSection.upsert({
            where: { id: section.id },
            update: data,
            create: { id: section.id, ...data },
          })
        : tx.aboutSection.create({ data });
    });
    return Response.json(toAboutSection(record));
  } catch (cause) {
    console.error("About section save failed", cause);
    return Response.json({ error: "Could not save this About section." }, { status: 500 });
  }
}
