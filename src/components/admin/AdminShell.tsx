"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Contact as ContactIcon,
  ExternalLink,
  FileText,
  Inbox,
  Info,
  LayoutDashboard,
  LogOut,
  Rocket,
  // Users,
  BookOpen,
  Mail,
  SlidersHorizontal,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAdmin } from "@/lib/admin-store";
import { signOut } from "next-auth/react";

const NAV = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Enquiries", url: "/admin/enquiries", icon: Inbox },
  { title: "Contacts", url: "/admin/contacts", icon: ContactIcon },
  { title: "Subscribers", url: "/admin/subscribers", icon: Mail },
  { title: "Properties", url: "/admin/properties", icon: Building2 },
  { title: "Homepage Search", url: "/admin/search-filters", icon: SlidersHorizontal },
  { title: "Future Projects", url: "/admin/future-projects", icon: Rocket },
  { title: "About & Team", url: "/admin/about", icon: Info },
  { title: "Why Najm", url: "/admin/why-najm", icon: Sparkles },
  { title: "Promises", url: "/admin/promises", icon: BadgeCheck },
  // { title: "Staff", url: "/admin/staff", icon: Users },
  { title: "Contact Info", url: "/admin/contact-info", icon: FileText },
  { title: "Knowledge Hub", url: "/admin/blog", icon: BookOpen },
] as const;

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = usePathname().replace(/\/$/, "") || "/";
  const { user, can } = useAdmin();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const refresh = () =>
      fetch("/api/admin/requests?type=counts", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { counts: { NEW: number } } | null) =>
          d && setNewCount(d.counts.NEW)
        )
        .catch(() => {});

    void refresh();
    window.addEventListener("enquiries:changed", refresh);

    return () => window.removeEventListener("enquiries:changed", refresh);
  }, [path]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-xl font-medium tracking-tight"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            N
          </span>
          {!collapsed && (
            <span>
              Najm <span className="text-muted-foreground">Admin</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter((n) => n.title !== "Staff" || can.staff).map((n) => (
                <SidebarMenuItem key={n.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      n.url === "/admin"
                        ? path === n.url
                        : path.startsWith(n.url)
                    }
                    tooltip={n.title}
                    size="lg"
                    className="rounded-full data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground"
                  >
                    <Link href={n.url}>
                      <n.icon className="h-5 w-5" />
                      <span className="text-base">{n.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {n.title === "Enquiries" && newCount > 0 && (
                    <SidebarMenuBadge className="rounded-full bg-primary text-primary-foreground">
                      {newCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Website</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View site">
                  <a href="/" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-5 w-5" />
                    <span>View live site</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <div className="rounded-2xl bg-cream p-3">
            <p className="truncate font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ redirectTo: "/login" })}
              tooltip="Sign out"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready } = useAdmin();

  if (!ready) return <div className="min-h-screen bg-cream" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-cream/60">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-background/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <p className="truncate text-sm text-muted-foreground">
              <span>Najm Estate admin panel</span>
            </p>
          </header>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-medium tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-[1.75rem] bg-background p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export const STATUS_STYLE: Record<string, string> = {
  New: "bg-primary text-primary-foreground",
  Contacted: "bg-cream text-foreground",
  Viewing: "bg-ink text-ink-foreground",
  Closed: "bg-muted text-muted-foreground",
};