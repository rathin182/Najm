"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Contact as ContactIcon, ExternalLink, Inbox, LayoutDashboard, LogOut, Users } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { DEMO_PASSWORD, useAdmin } from "@/lib/admin-store";

const NAV = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Enquiries", url: "/admin/enquiries", icon: Inbox },
  { title: "Contacts", url: "/admin/contacts", icon: ContactIcon },
  { title: "Properties", url: "/admin/properties", icon: Building2 },
  { title: "Staff", url: "/admin/staff", icon: Users },
] as const;

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = usePathname().replace(/\/$/, "") || "/";
  const { user, can, enquiries, logout } = useAdmin();
  const newCount = enquiries.filter((e) => e.status === "New").length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-5">
        <Link href="/admin" className="flex items-center gap-2 text-xl font-medium tracking-tight">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">N</span>
          {!collapsed && <span>Najm <span className="text-muted-foreground">Admin</span></span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter((n) => n.title !== "Staff" || can.staff).map((n) => (
                <SidebarMenuItem key={n.url}>
                  <SidebarMenuButton asChild isActive={n.url === "/admin" ? path === n.url : path.startsWith(n.url)} tooltip={n.title} size="lg" className="rounded-full data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground">
                    <Link href={n.url}><n.icon className="h-5 w-5" /><span className="text-base">{n.title}</span></Link>
                  </SidebarMenuButton>
                  {n.title === "Enquiries" && newCount > 0 && <SidebarMenuBadge className="rounded-full bg-primary text-primary-foreground">{newCount}</SidebarMenuBadge>}
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
                <SidebarMenuButton asChild tooltip="View site"><a href="/" target="_blank" rel="noreferrer"><ExternalLink className="h-5 w-5" /><span>View live site</span></a></SidebarMenuButton>
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
            <SidebarMenuButton onClick={logout} tooltip="Sign out"><LogOut className="h-5 w-5" /><span>Sign out</span></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function Login() {
  const { login, staff } = useAdmin();
  const [email, setEmail] = useState("admin@najm.sa");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6">
      <form className="w-full max-w-md rounded-[2rem] bg-background p-10" onSubmit={(e) => { e.preventDefault(); setErr(login(email, password)); }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">N</span>
        <h1 className="mt-8 text-4xl font-medium tracking-tight">Staff <span className="fancy">sign in</span></h1>
        <p className="mt-2 text-muted-foreground">Najm Estate admin panel</p>
        <div className="mt-8 flex flex-col gap-3">
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" />
          {err && <p className="px-4 text-sm text-destructive">{err}</p>}
          <button className="mt-2 rounded-full bg-primary py-4 text-lg text-primary-foreground transition-colors hover:bg-ink">Sign in</button>
        </div>
        <div className="mt-8 rounded-2xl bg-cream p-4 text-sm">
          <p className="font-medium">Demo accounts · password {DEMO_PASSWORD}</p>
          <div className="mt-2 flex flex-col gap-1">
            {staff.filter((s) => s.active).map((s) => (
              <button type="button" key={s.id} onClick={() => { setEmail(s.email); setPassword(DEMO_PASSWORD); }} className="flex justify-between rounded-xl px-2 py-1.5 text-left hover:bg-background">
                <span>{s.email}</span><span className="text-muted-foreground">{s.role}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready, user } = useAdmin();
  if (!ready) return <div className="min-h-screen bg-cream" />;
  if (!user) return <Login />;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-cream/60">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-background/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <p className="truncate text-sm text-muted-foreground"><span className="sm:hidden">Demo mode</span><span className="hidden sm:inline">Demo mode — changes are saved in this browser only</span></p>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
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

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-[1.75rem] bg-background p-5 md:p-6 ${className}`}>{children}</div>;
}

export const STATUS_STYLE: Record<string, string> = {
  New: "bg-primary text-primary-foreground",
  Contacted: "bg-cream text-foreground",
  Viewing: "bg-ink text-ink-foreground",
  Closed: "bg-muted text-muted-foreground",
};
