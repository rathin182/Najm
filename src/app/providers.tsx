"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminProvider } from "@/lib/admin-store";
import { Footer, Nav, SmoothScroll, SubscribeSection } from "@/components/site/Layout";
import { useLiquidGlass } from "@/components/site/motion";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/site/PageTransition";
import { SessionProvider } from "next-auth/react";

// function PublicEffects() {
//   useLiquidGlass(".lg-nav", { refraction: 0.006, bevelDepth: 0.06, bevelWidth: 0.12 });
//   return <><SmoothScroll /><Nav /></>;
// }
function PublicEffects() {
  // One-time cleanup: earlier visits wrote the admin demo workspace into every visitor's browser.
  useEffect(() => {
    try { localStorage.removeItem("najm-admin-v1"); localStorage.removeItem("najm-inbox-v1"); } catch { /* ignore */ }
  }, []);
  useLiquidGlass(".lg-nav", { refraction: 0.006, bevelDepth: 0.06, bevelWidth: 0.12 });
  return <><SmoothScroll /><Nav /></>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAdmin = path.startsWith("/admin");
  return (
    <>
      {isAdmin ? (
        <SessionProvider>
          <AdminProvider>{children}</AdminProvider>
        </SessionProvider>
      ) : (
        <>
          <PublicEffects />
          {children}
          <SubscribeSection />
          <Footer />
        </>
      )}
      <Toaster position="bottom-center" />
      <PageTransition />
    </>
  );
}