
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const otp =
            typeof body.otp === "string" ? body.otp.trim() : "";

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            !/^\d{6}$/.test(otp)
        ) {
            return NextResponse.json(
                { error: "Enter a valid email and 6-digit OTP." },
                { status: 400 },
            );
        }

        const secret = process.env.OTP_SECRET;

        if (!secret) {
            return NextResponse.json(
                { error: "Email verification is temporarily unavailable." },
                { status: 500 },
            );
        }

        const record = await prisma.verificationToken.findFirst({
            where: { identifier: email },
            orderBy: { expires: "desc" },
        });

        if (!record || record.expires <= new Date()) {
            return NextResponse.json(
                { error: "OTP is invalid or expired. Please request a new one." },
                { status: 400 },
            );
        }

        const expectedToken = createHmac("sha256", secret)
            .update(`${email}:${otp}`)
            .digest();

        let storedToken: Buffer;

        try {
            storedToken = Buffer.from(record.token, "hex");
        } catch {
            return NextResponse.json(
                { error: "Invalid OTP. Please request a new one." },
                { status: 400 },
            );
        }

        if (
            storedToken.length !== expectedToken.length ||
            !timingSafeEqual(storedToken, expectedToken)
        ) {
            return NextResponse.json(
                { error: "Incorrect OTP." },
                { status: 400 },
            );
        }
        const verifiedToken = createHmac("sha256", secret)
            .update(`${email}:VERIFIED`)
            .digest("hex");

        await prisma.verificationToken.update({
            where: {
                identifier_token: {
                    identifier: email,
                    token: record.token,
                },
            },
            data: {
                token: verifiedToken,
                expires: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        return NextResponse.json({
            message: "Email verified successfully.",
            verified: true,
        });
    } catch (error) {
        console.error("Verify OTP failed:", error);

        return NextResponse.json(
            { error: "Could not verify the OTP. Please try again." },
            { status: 500 },
        );
    }
}
