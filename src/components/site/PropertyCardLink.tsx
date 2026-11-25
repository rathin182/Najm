"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { showRouteLoading } from "@/components/site/PageTransition";

export function PropertyCardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const openProperty = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || pathname === href) return;
    event.preventDefault();
    showRouteLoading();
    window.requestAnimationFrame(() => router.push(href));
  };
  return <Link href={href} onClick={openProperty} className={className}>{children}</Link>;
}
