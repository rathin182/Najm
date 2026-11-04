import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import { DEFAULT_WHY_NAJM, toWhyNajmSettings, WHY_NAJM_ICON_KEYS, WHY_NAJM_LIMITS, type WhyNajmSettingsData } from "@/lib/why-najm";

export const dynamic = "force-dynamic";

const schema = z.object({
  headingAccent: z.string().trim().max(40),
  heading: z.string().trim().min(1).max(60),
  intro: z.string().trim().max(600),
  stats: z.array(z.object({ value: z.string().trim().min(1).max(24), label: z.string().trim().min(1).max(80) })).max(WHY_NAJM_LIMITS.stats),
  pillarsTitle: z.string().trim().max(120),
  pillarsAccent: z.string().trim().max(60),
  pillars: z.array(z.object({
    icon: z.enum(WHY_NAJM_ICON_KEYS),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(400),
  })).max(WHY_NAJM_LIMITS.pillars),
});

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  try {
    const row = await prisma.whyNajmSettings.findUnique({ where: { id: "main" } });
    return NextResponse.json(toWhyNajmSettings(row));
  } catch (e) {
    if ((e as { code?: string }).code === "P2021") return NextResponse.json(DEFAULT_WHY_NAJM);
    throw e;
  }
}

export async function PUT(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  // Partial on purpose: the Why Najm and Promises admin pages each send only their own fields,
  // so saving one page can never overwrite what the other manages.
  const parsed = schema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the fields — something is missing or too long." }, { status: 400 });
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined)) as Partial<WhyNajmSettingsData>;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  try {
    const row = await prisma.whyNajmSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...DEFAULT_WHY_NAJM, ...data },
      update: data,
    });
    return NextResponse.json(toWhyNajmSettings(row));
  } catch (e) {
    console.error("Save Why Najm settings error:", e);
    return NextResponse.json({ error: "Could not save. Has the database migration been run?" }, { status: 500 });
  }
}