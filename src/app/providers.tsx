"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminProvider } from "@/lib/admin-store";
import { Footer, Nav, SmoothScroll } from "@/components/site/Layout";
import { useLiquidGlass } from "@/components/site/motion";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/site/PageTransition";
import { SessionProvider } from "next-auth/react";

function PublicEffects() {
  useLiquidGlass(".lg-nav", { refraction: 0.006, bevelDepth: 0.06, bevelWidth: 0.12 });
  return <><SmoothScroll /><Nav /></>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAdmin = path.startsWith("/admin");
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Pinyon+Script&display=swap";
    document.head.appendChild(link);
    return () => link.remove();
  }, [path]);
  return <SessionProvider><AdminProvider>{isAdmin ? children : <><PublicEffects />{children}<Footer /></>}<Toaster position="bottom-center" /><PageTransition /></AdminProvider></SessionProvider>;
}
