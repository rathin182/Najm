"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Building2, Eye, Inbox, Plus, Wallet } from "lucide-react";
import { fmtDate, useAdmin } from "@/lib/admin-store";
import { Panel, STATUS_STYLE } from "@/components/admin/AdminShell";


const C = ["var(--primary)", "var(--ink)", "oklch(0.75 0.06 85)", "oklch(0.62 0.07 158)", "oklch(0.85 0.03 85)"];

function Dashboard() {
  const { properties, enquiries, contacts, user } = useAdmin();

  const stats = useMemo(() => {
    const views = properties.reduce((s, p) => s + p.views, 0);
    const value = properties.reduce((s, p) => s + p.price, 0);
    const fresh = enquiries.filter((e) => e.status === "New").length;
    const closed = enquiries.filter((e) => e.status === "Closed").length;
    return [
      { label: "Total listing views", value: views.toLocaleString("en"), icon: Eye },
      { label: "New enquiries", value: String(fresh), icon: Inbox },
      { label: "Active listings", value: String(properties.filter((p) => p.published).length), icon: Building2 },
      { label: "Portfolio value", value: `SAR ${Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`, icon: Wallet },
      { label: "Conversion", value: `${enquiries.length ? Math.round((closed / enquiries.length) * 100) : 0}%`, icon: ArrowUpRight },
    ];
  }, [properties, enquiries]);

  const trend = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const key = d.toDateString();
    return { day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), enquiries: enquiries.filter((e) => new Date(e.date).toDateString() === key).length, views: 180 + ((i * 53) % 120) + i * 9 };
  }), [enquiries]);

  const byCity = useMemo(() => Object.entries(properties.reduce<Record<string, number>>((a, p) => ((a[p.city] = (a[p.city] ?? 0) + 1), a), {})).map(([name, value]) => ({ name, value })), [properties]);
  const bySource = useMemo(() => Object.entries(enquiries.reduce<Record<string, number>>((a, e) => ((a[e.source] = (a[e.source] ?? 0) + 1), a), {})).map(([name, value]) => ({ name, value })), [enquiries]);
  const topViewed = [...properties].sort((a, b) => b.views - a.views).slice(0, 5);
  const recent = [...enquiries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const maxViews = topViewed[0]?.views ?? 1;
  const pipeline = (["New", "Contacted", "Viewing", "Closed"] as const).map((status, i) => ({ status, n: enquiries.filter((e) => e.status === status).length, color: C[i]! }));

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground md:p-10">
          <p className="opacity-70">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Welcome back, <span className="fancy !text-primary-foreground">{user?.name.split(" ")[0]}</span></h1>
          <p className="mt-3 max-w-lg text-lg opacity-80">You have {enquiries.filter((e) => e.status === "New").length} new enquiries waiting and {properties.filter((p) => p.published).length} listings live on the site.</p>
          <div className="relative z-10 mt-8 flex flex-wrap gap-2">
            <Link href="/admin/properties/new" className="flex items-center gap-2 rounded-full bg-background px-5 py-3 text-foreground hover:bg-cream"><Plus className="h-4 w-4" />Add property</Link>
            <Link href="/admin/enquiries" className="flex items-center gap-2 rounded-full bg-primary-foreground/15 px-5 py-3 hover:bg-primary-foreground/25"><Inbox className="h-4 w-4" />Reply to enquiries</Link>
          </div>
          <p aria-hidden className="pointer-events-none absolute -bottom-10 right-6 select-none text-[10rem] font-medium leading-none tracking-tighter opacity-[0.06]">Najm</p>
        </div>
        <Panel>
          <p className="text-xl font-medium">Enquiry pipeline</p>
          <p className="text-sm text-muted-foreground">{enquiries.length} enquiries in total</p>
          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-cream">
            {pipeline.map((s) => <div key={s.status} style={{ width: `${(s.n / Math.max(1, enquiries.length)) * 100}%`, background: s.color }} />)}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            {pipeline.map((s) => (
              <li key={s.status} className="rounded-2xl bg-cream p-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.status}</span>
                <p className="mt-1 text-3xl font-medium tracking-tight">{s.n}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s, i) => (
          <Panel key={s.label} className="transition-transform duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-primary"><s.icon className="h-5 w-5" /></span>
              <span className="text-sm text-primary">+{[12, 8, 3, 6, 2][i]}%</span>
            </div>
            <p className="mt-6 text-3xl font-medium tracking-tight">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel>
          <p className="text-xl font-medium">Traffic & enquiries · last 14 days</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid vertical={false} stroke="var(--cream)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="v" tickLine={false} axisLine={false} fontSize={12} width={36} />
                <YAxis yAxisId="e" orientation="right" tickLine={false} axisLine={false} fontSize={12} width={24} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "none" }} />
                <Area yAxisId="v" type="monotone" dataKey="views" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2} />
                <Area yAxisId="e" type="monotone" dataKey="enquiries" stroke="var(--ink)" fill="var(--ink)" fillOpacity={0.06} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <p className="text-xl font-medium">Enquiry sources</p>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {bySource.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {bySource.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: C[i % C.length] }} />{s.name}<span className="ml-auto font-medium">{s.value}</span></li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <p className="text-xl font-medium">Recent enquiries</p>
            <Link href="/admin/enquiries" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <ul className="mt-4 divide-y divide-cream">
            {recent.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream font-medium">{e.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{e.message}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="text-xl font-medium">Most viewed properties</p>
          <ul className="mt-4 space-y-4">
            {topViewed.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={p.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-primary" style={{ width: `${(p.views / maxViews) * 100}%` }} /></div>
                </div>
                <span className="text-sm text-muted-foreground">{p.views.toLocaleString("en")}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <p className="text-xl font-medium">Listings by city</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCity}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis hide allowDecimals={false} />
                <Tooltip cursor={{ fill: "var(--cream)" }} contentStyle={{ borderRadius: 16, border: "none" }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{contacts.length} contacts in your address book</p>
        </Panel>
      </div>
    </div>
  );
}

export default Dashboard;
