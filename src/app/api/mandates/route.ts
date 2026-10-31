
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_INVESTOR_TYPES = [
  "Individual",
  "Family Office",
  "Institution",
  "Developer",
  "Other",
] as const;

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const name = getString(data.name);
    const email = getString(data.email).toLowerCase();
    const phone = getString(data.phone);
    const investorType = getString(data.investorType);
    const allocationTier = getString(data.allocationTier);
    const region = getString(data.region);
    const message = getString(data.message);
    const source = getString(data.source);

    if (!name || !email || !phone || !investorType) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, phone, and investor type are required.",
        },
        { status: 400 },
      );
    }

    if (name.length > 150 || email.length > 254 || phone.length > 40) {
      return NextResponse.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (investorType.length > 100 || allocationTier.length > 100 || region.length > 150) {
      return NextResponse.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400 },
      );
    }

    if (message.length > 5000 || source.length > 100) {
      return NextResponse.json(
        { success: false, message: "Message or source exceeds the allowed length." },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_INVESTOR_TYPES.includes(
        investorType as (typeof ALLOWED_INVESTOR_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid investor type." },
        { status: 400 },
      );
    }

    const mandate = await prisma.acquisitionMandate.create({
      data: {
        name,
        email,
        phone,
        investorType,
        allocationTier: allocationTier || null,
        region: region || null,
        message: message || null,
        source: source || "contact-page",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your acquisition mandate request has been submitted.",
        mandate: {
          id: mandate.id,
          status: mandate.status,
          createdAt: mandate.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request." },
        { status: 400 },
      );
    }

    console.error("Failed to create acquisition mandate:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your request right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
