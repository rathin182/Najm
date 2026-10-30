"use client";
import { useState } from "react";
import { PropertyEditor, blankProperty } from "@/components/admin/PropertyEditor";
import { Panel } from "@/components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-store";


function NewProperty() {
  const { can } = useAdmin();
  const [initial] = useState(blankProperty);
  if (!can.edit) return <Panel>Your role can't add properties.</Panel>;
  return <PropertyEditor initial={initial} />;
}

export default NewProperty;
