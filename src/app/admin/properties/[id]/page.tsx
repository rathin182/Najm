"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { Panel } from "@/components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-store";

function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const { properties, can } = useAdmin();
  const p = properties.find((x) => x.id === id);
  if (!can.edit) return <Panel>Your role can't edit properties.</Panel>;
  if (!p) return <Panel>That property no longer exists. <Link href="/admin/properties" className="text-primary">Back to properties</Link></Panel>;
  return <PropertyEditor key={p.id} initial={p} />;
}

export default EditProperty;
