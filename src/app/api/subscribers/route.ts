import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

// Public endpoint: newsletter / private-listings sign-up.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    // Idempotent: subscribing twice with the same email is not an error.
    await prisma.subscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: {},
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Subscribe failed:", error);

    return Response.json(
      { error: "Could not subscribe right now. Please try again later." },
      { status: 500 }
    );
  }
}