
import { createHmac, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const secret = process.env.OTP_SECRET;
    if (!secret) {
      console.error("OTP_SECRET is not configured.");
      return NextResponse.json(
        { error: "Email verification is temporarily unavailable." },
        { status: 500 },
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    const token = createHmac("sha256", secret)
      .update(`${email}:${otp}`)
      .digest("hex");

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      throw error;
    }

    return NextResponse.json({
      message: "Verification code sent. Check your email.",
    });
  } catch (error) {
    console.error("Send OTP failed:", error);
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again." },
      { status: 500 },
    );
  }
}
