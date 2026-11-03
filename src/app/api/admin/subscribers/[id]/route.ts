import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  try {
    const result = await prisma.subscriber.deleteMany({ where: { id } });

    if (!result.count) {
      return NextResponse.json(
        { error: "Subscriber not found." },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (cause) {
    console.error("Admin subscriber DELETE error:", cause);

    return NextResponse.json(
      { error: "Could not remove subscriber." },
      { status: 500 }
    );
  }
}