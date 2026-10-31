import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminLogin from "@/components/admin/AdminLogin";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");
  return <AdminLogin />;
}
