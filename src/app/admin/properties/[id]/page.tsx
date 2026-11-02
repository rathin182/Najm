"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { Panel } from "@/components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-store";

function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const { properties, can } = useAdmin();
  const [remote, setRemote] = useState<import("@/lib/admin-store").AdminProperty | null>(null);
  const [loaded, setLoaded] = useState(false);
  const p = properties.find((x) => x.id === id) ?? remote;
  useEffect(() => {
    if (properties.some((item) => item.id === id)) { setLoaded(true); return; }
    let cancelled = false;
    fetch("/api/admin/listings", { credentials: "include" }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load listing.");
      return response.json();
    }).then((listings) => {
      if (!cancelled) { setRemote(Array.isArray(listings) ? listings.find((item) => item.id === id) ?? null : null); setLoaded(true); }
    }).catch(() => { if (!cancelled) { setLoaded(true); toast.error("Could not load saved property."); } });
    return () => { cancelled = true; };
  }, [id, properties]);
  if (!can.edit) return <Panel>Your role can't edit properties.</Panel>;
  if (!loaded) return <Panel>Loading property…</Panel>;
  if (!p) return <Panel>That property no longer exists. <Link href="/admin/properties" className="text-primary">Back to properties</Link></Panel>;
  return <PropertyEditor key={p.id} initial={p} />;
}

export default EditProperty;
