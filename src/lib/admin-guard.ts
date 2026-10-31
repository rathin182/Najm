import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type StaffRole = "ADMIN";
export async function guard(roles: StaffRole[]) {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }), session: null };
  if (!roles.includes(session.user.role as StaffRole)) return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }), session: null };
  return { error: null, session };
}