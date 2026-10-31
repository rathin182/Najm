import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import { DEFAULT_CONTACT_SETTINGS, toContactSettings } from "@/lib/contact-settings";

export const dynamic = "force-dynamic";

const coord = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().min(min).max(max).nullable());

const schema = z.object({
  heading: z.string().trim().min(1).max(60),
  headingAccent: z.string().trim().max(60),
  subheading: z.string().trim().max(300),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(254),
  hours: z.string().trim().max(200),
  offices: z.array(z.object({ city: z.string().trim().min(1).max(80), address: z.string().trim().max(160) })).max(6),
  mapTitle: z.string().trim().max(120),
  mapLatitude: coord(-90, 90),
  mapLongitude: coord(-180, 180),
  mapAddress: z.string().trim().max(300),
  mapZoom: z.number().int().min(1).max(21),
});

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  try {
    const row = await prisma.contactSettings.findUnique({ where: { id: "main" } });
    return NextResponse.json(toContactSettings(row));
  } catch (e) {
    if ((e as { code?: string }).code === "P2021") return NextResponse.json(DEFAULT_CONTACT_SETTINGS);
    throw e;
  }
}

export async function PUT(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the fields — something is invalid." }, { status: 400 });
  const d = parsed.data;
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if ((d.mapLatitude === null) !== (d.mapLongitude === null))
    return NextResponse.json({ error: "Enter both latitude and longitude, or leave both empty." }, { status: 400 });
  try {
    const row = await prisma.contactSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...d },
      update: d,
    });
    return NextResponse.json(toContactSettings(row));
  } catch (e) {
    console.error("Save contact settings error:", e);
    return NextResponse.json({ error: "Could not save. Has the database migration been run?" }, { status: 500 });
  }
}