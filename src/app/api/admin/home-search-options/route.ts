import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import {
  HOME_SEARCH_GROUPS,
  groupHomeSearchOptions,
  validateHomeSearchOptions,
} from "@/lib/home-search-options";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  try {
    const rows = await prisma.homeSearchOption.findMany({
      orderBy: [{ group: "asc" }, { position: "asc" }],
    });
    const result = groupHomeSearchOptions(rows);
    for (const group of HOME_SEARCH_GROUPS)
      result[group] = rows
        .filter((row) => row.group === group)
        .map(({ id, value, label }) => ({ id, value, label }));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Load homepage search options failed:", cause);
    return NextResponse.json({ error: databaseError(cause) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;
  const options: unknown = await request.json().catch(() => null);
  if (!validateHomeSearchOptions(options))
    return NextResponse.json(
      { error: "Please check each option label and value." },
      { status: 400 },
    );

  for (const group of HOME_SEARCH_GROUPS) {
    const values = options[group].map((option) => option.value.trim().toLocaleLowerCase());
    if (new Set(values).size !== values.length) {
      return NextResponse.json(
        { error: `The ${group} group has duplicate filter values. Each value must be unique.` },
        { status: 400 },
      );
    }
  }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      for (const group of HOME_SEARCH_GROUPS) {
        const existing = await tx.homeSearchOption.findMany({
          where: { group },
          select: { id: true, value: true },
        });
        const submitted = options[group].map((option, position) => ({
          ...option,
          value: option.value.trim(),
          label: option.label.trim(),
          position,
        }));
        const submittedValues = new Set(submitted.map((option) => option.value));
        const valuesToDelete = existing
          .filter((row) => !submittedValues.has(row.value))
          .map((row) => row.id);
        if (valuesToDelete.length)
          await tx.homeSearchOption.deleteMany({ where: { id: { in: valuesToDelete } } });
        for (const option of submitted) {
          await tx.homeSearchOption.upsert({
            where: { group_value: { group, value: option.value } },
            create: {
              group,
              value: option.value,
              label: option.label,
              position: option.position,
              enabled: true,
            },
            update: { label: option.label, position: option.position, enabled: true },
          });
        }
      }
      return tx.homeSearchOption.findMany({
        where: { enabled: true },
        orderBy: [{ group: "asc" }, { position: "asc" }],
      });
    });
    const result = groupHomeSearchOptions(saved);
    for (const group of HOME_SEARCH_GROUPS)
      result[group] = saved
        .filter((row) => row.group === group)
        .map(({ id, value, label }) => ({ id, value, label }));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Save homepage search options failed:", cause);
    return NextResponse.json({ error: databaseError(cause) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const group = searchParams.get("group");

  if (!id || !group || !HOME_SEARCH_GROUPS.includes(group as (typeof HOME_SEARCH_GROUPS)[number])) {
    return NextResponse.json(
      { error: "A valid option ID and group are required." },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.homeSearchOption.deleteMany({ where: { id, group } });
      if (deleted.count === 0) return false;

      const remaining = await tx.homeSearchOption.findMany({
        where: { group },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });

      for (const [position, option] of remaining.entries()) {
        await tx.homeSearchOption.update({ where: { id: option.id }, data: { position } });
      }

      return true;
    });

    if (!result) {
      return NextResponse.json(
        { error: "This search option was already deleted." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error("Delete homepage search option failed:", cause);
    return NextResponse.json({ error: databaseError(cause) }, { status: 500 });
  }
}

function databaseError(cause: unknown) {
  const error = cause as { code?: string; message?: string };
  if (error.code === "P2021" || error.code === "42P01")
    return "The HomeSearchOption table is missing from the connected database. Run `npx prisma db push` against the production DATABASE_URL.";
  if (error.code === "P2002")
    return "A duplicate group and filter value already exists in HomeSearchOption. Remove the duplicate row in the database, then save again.";
  if (error.code === "P1001" || error.code === "P1002")
    return "Could not connect to the database. Check the deployed DATABASE_URL and database availability.";
  return "Could not save homepage search options. Check the server logs and confirm the database schema is up to date.";
}
