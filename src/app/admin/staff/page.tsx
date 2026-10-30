"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { DEMO_PASSWORD, newId, PERMS, useAdmin, type Role } from "@/lib/admin-store";
import { PageHeader, Panel } from "@/components/admin/AdminShell";


const ROLES: Role[] = ["Admin", "Agent", "Viewer"];
const ROLE_TEXT: Record<Role, string> = { Admin: "Everything, including staff", Agent: "Add and edit, no deleting", Viewer: "Read only" };

function StaffPage() {
  const { staff, saveStaff, deleteStaff, user, can, reset } = useAdmin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Agent");

  if (!can.staff) return <Panel>Only admins can manage staff.</Panel>;

  return (
    <div>
      <PageHeader title="Staff" sub={`New accounts sign in with the demo password ${DEMO_PASSWORD}`} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="!p-2">
          <ul>
            {staff.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl p-4 hover:bg-cream/60">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream font-medium">{s.name[0]}</span>
                <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto"><p className="font-medium">{s.name}{s.id === user?.id && <span className="text-muted-foreground"> · you</span>}</p><p className="text-sm text-muted-foreground">{s.email}</p></div>
                <select value={s.role} disabled={s.id === user?.id} aria-label="Role" onChange={(e) => saveStaff({ ...s, role: e.target.value as Role })} className="field !w-auto !py-2 ml-14 sm:ml-0">{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                <Switch checked={s.active} disabled={s.id === user?.id} onCheckedChange={(v) => saveStaff({ ...s, active: v })} aria-label="Active" />
                <button aria-label="Remove" disabled={s.id === user?.id} onClick={() => { if (confirm(`Remove ${s.name}?`)) deleteStaff(s.id); }} className="rounded-full p-2 text-destructive hover:bg-cream disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel>
            <p className="text-xl font-medium">Invite staff member</p>
            <form className="mt-4 grid gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !email.includes("@")) { toast.error("Name and a valid email are required"); return; }
              if (staff.some((s) => s.email.toLowerCase() === email.toLowerCase())) { toast.error("That email already has an account"); return; }
              saveStaff({ id: newId(), name: name.trim(), email: email.trim(), role, active: true }); setName(""); setEmail(""); toast.success("Staff member added");
            }}>
              <input className="field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="field" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
              <button className="flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-primary-foreground"><Plus className="h-4 w-4" />Add member</button>
            </form>
          </Panel>
          <Panel>
            <p className="text-xl font-medium">Roles</p>
            <ul className="mt-3 space-y-2">{ROLES.map((r) => <li key={r} className="flex justify-between gap-4"><span className="font-medium">{r}</span><span className="text-right text-sm text-muted-foreground">{ROLE_TEXT[r]}{PERMS[r].delete ? "" : ""}</span></li>)}</ul>
          </Panel>
          <button onClick={() => { if (confirm("Reset all demo data?")) { reset(); toast.success("Demo data restored"); } }} className="rounded-full bg-background py-3 text-sm text-muted-foreground hover:text-destructive">Reset demo data</button>
        </div>
      </div>
    </div>
  );
}

export default StaffPage;
