"use client";

import { useMemo, useState } from "react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { Plus, Search, X } from "lucide-react";
import type { PropertyAmenity } from "@/lib/property-amenities";
import { normalizeAmenity } from "@/lib/property-amenities";

export function PropertyAmenitiesEditor({ values, onChange }: { values: Array<string | PropertyAmenity>; onChange: (values: PropertyAmenity[]) => void }) {
  const amenities = values.map(normalizeAmenity);
  const [openPicker, setOpenPicker] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const filteredIcons = useMemo(() => iconNames.filter((name) => name.includes(search.trim().toLowerCase())).slice(0, 72), [search]);

  const update = (index: number, changes: Partial<PropertyAmenity>) => onChange(amenities.map((amenity, i) => i === index ? { ...amenity, ...changes } : amenity));
  const add = () => onChange([...amenities, { name: "", icon: "sparkles" }]);

  return (
    <div className="sm:col-span-2 space-y-3">
      <p className="px-1 text-sm text-muted-foreground">Amenities</p>
      {amenities.map((amenity, index) => (
        <div key={index} className="rounded-2xl bg-cream p-3">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <DynamicIcon name={amenity.icon as IconName} size={19} className="shrink-0 text-primary" />
              <input className="field min-w-0 flex-1" value={amenity.name} onChange={(event) => update(index, { name: event.target.value })} placeholder="Amenity name, e.g. Private pool" aria-label={`Amenity ${index + 1} name`} />
            </div>
            <button type="button" onClick={() => { setOpenPicker(openPicker === index ? null : index); setSearch(""); }} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-background px-4 text-sm hover:bg-muted" aria-expanded={openPicker === index}>
              <DynamicIcon name={amenity.icon as IconName} size={17} /> <span className="hidden sm:inline">{amenity.icon}</span> Icon
            </button>
            <button type="button" onClick={() => onChange(amenities.filter((_, i) => i !== index))} aria-label={`Remove amenity ${amenity.name || index + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"><X className="h-4 w-4" /></button>
          </div>
          {openPicker === index && (
            <div className="mt-3 rounded-2xl bg-background p-3">
              <label className="flex items-center gap-2 rounded-xl bg-cream px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search all Lucide icons" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </label>
              <p className="my-2 text-xs text-muted-foreground">{iconNames.length.toLocaleString()} icons available · showing {filteredIcons.length} matches</p>
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
                {filteredIcons.map((name) => (
                  <button key={name} type="button" title={name} onClick={() => { update(index, { icon: name }); setOpenPicker(null); }} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border p-2 text-center text-[11px] hover:border-primary hover:bg-primary/5 ${amenity.icon === name ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                    <DynamicIcon name={name as IconName} size={20} />
                    <span className="w-full truncate">{name}</span>
                  </button>
                ))}
                {!filteredIcons.length && <p className="col-span-full py-5 text-center text-sm text-muted-foreground">No icons match that search.</p>}
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="flex w-fit items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" />Add amenity</button>
    </div>
  );
}
