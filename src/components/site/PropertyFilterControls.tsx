"use client";
import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Home, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_LABELS, CATEGORY_TYPES, type PropertyCategoryKey } from "@/lib/property-categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";

/** Multi-select dropdown with a search box (used for Location). */
export function MultiSelectDropdown({ options, selected, onChange, placeholder, noun, searchPlaceholder = "Search location…", }: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  noun: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isSelected = (option: string) => selected.some((item) => item.toLowerCase() === option.toLowerCase());
  const toggle = (option: string) => onChange(
      isSelected(option)
        ? selected.filter((item) => item.toLowerCase() !== option.toLowerCase())
        : [...selected, option],
    );
  const label = selected.length === 0 ? placeholder : selected.length <= 2 ? selected.join(", ") : `${selected.length} ${noun} selected`;
  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options;

  return (
    <Popover open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-left text-[13px]">
          <span className={`truncate ${selected.length ? "" : "text-muted-foreground"}`}>{label}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-56 rounded-xl p-1.5">
        <div className="relative mb-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input type="text" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="w-full rounded-lg bg-cream py-2 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"/>
        </div>
        <div role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto overscroll-contain">
          {visible.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-muted-foreground">
              {options.length === 0 ? "No options available" : `No ${noun} match “${query.trim()}”`}
            </p>
          )}
          {visible.map((option) => {
            const checked = isSelected(option);
            return (
              <button key={option} type="button" role="option" aria-selected={checked} onClick={() => toggle(option)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-cream">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {checked && <Check className="h-3 w-3" />}
                </span>
                {option}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-lg border-t border-border px-2.5 pb-1 pt-2 text-left text-xs text-primary hover:underline">
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Single-select dropdown. */
/** Single-select dropdown. */
export function SingleSelectDropdown({ options, value, onChange, placeholder, label, disabled = false, }: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}) {
  const hasValue = value !== "" && options.some((option) => option === value);
  const list = value && !hasValue ? [value, ...options] : options;

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className="h-11 w-full rounded-xl border-0 bg-cream px-3.5 text-[13px] shadow-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="rounded-xl border-border bg-background shadow-soft">
        {list.map((option) => (
          <SelectItem key={option} value={option} className="rounded-lg py-2.5 text-[13px] focus:bg-primary/10 focus:text-foreground">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Residential / Commercial buttons + a type dropdown that lists only that category's types. */
export function PropertyTypeFilter({ category, type, onChange, }: {
  category: string | undefined;
  type: string | undefined;
  onChange: (category: string | undefined, type: string | undefined) => void;
}) {
  const lowerType = (type ?? "").toLowerCase();
  const typeIsCategoryWord = lowerType === "residential" || lowerType === "commercial";
  const keys = Object.keys(CATEGORY_TYPES) as PropertyCategoryKey[];
  // Falls back to the type in the URL (e.g. ?type=Villa from a link) so the right category lights up.
  const active: PropertyCategoryKey | undefined = category === "residential" || category === "commercial" ? category : keys.find((key) => key === lowerType || CATEGORY_TYPES[key].some((item) => item.toLowerCase() === lowerType));
  const options: string[] = active ? [...CATEGORY_TYPES[active]] : [];
  const value = options.find((option) => option.toLowerCase() === lowerType) ?? (type && !typeIsCategoryWord ? type : "");
  const icons = { residential: Home, commercial: Building2 } as const;

  return (
    <div className="flex flex-col gap-2 px-1 pb-1">
      <div className="flex gap-1 rounded-full bg-cream p-1">
        {keys.map((key) => {
        //   const Icon = icons[key];
          return (
            <button key={key} type="button" aria-pressed={active === key} onClick={() => onChange(active === key ? undefined : key, undefined)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[13px] transition-colors ${active === key ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>
              {/* <Icon className="h-3.5 w-3.5" /> */}
              {CATEGORY_LABELS[key]}
            </button>
          );
        })}
      </div>
      <SingleSelectDropdown label="Property type" options={options} value={value} disabled={!active} placeholder={active ? `All ${CATEGORY_LABELS[active].toLowerCase()} types` : "Select a category first"} onChange={(next) => onChange(active, next || undefined)}/>
    </div>
  );
}

/** Segmented buttons with a separate label and value. Clicking the active one clears it (handled by the caller). */
export function OptionSegment({ options, value, onPick, }: {
  options: { value: string; label: string }[];
  value: string | undefined;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-cream p-1">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onPick(option.value)} className={`flex-1 rounded-full px-1 py-1.5 text-[13px] transition-colors ${value === option.value ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Area filter: minimum and maximum in m². Applies ~0.5s after typing stops. */
export function AreaRangeFilter({ min, max, onChange, }: {
  min: string | undefined;
  max: string | undefined;
  onChange: (min: string, max: string) => void;
}) {
  const [draftMin, setDraftMin] = useState(min ?? "");
  const [draftMax, setDraftMax] = useState(max ?? "");
  const lastPushed = useRef("");

  // Keep the inputs in sync when the URL changes from outside (e.g. "Clear all" or browser back).
  useEffect(() => {
    if (`${min ?? ""}:${max ?? ""}` === lastPushed.current) return; // our own update coming back
    lastPushed.current = "";
    setDraftMin(min ?? "");
    setDraftMax(max ?? "");
  }, [min, max]);

  useEffect(() => {
    if (draftMin === (min ?? "") && draftMax === (max ?? "")) return;
    const timer = setTimeout(() => {
      lastPushed.current = `${draftMin}:${draftMax}`;
      onChange(draftMin, draftMax);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftMin, draftMax]);

  const invalid = draftMin !== "" && draftMax !== "" && Number(draftMin) > Number(draftMax);
  const digits = (value: string) => value.replace(/[^\d]/g, "");
  return (
    <div className="px-1 pb-1">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input type="text" inputMode="numeric" aria-label="Minimum area in square metres" placeholder="Min" value={draftMin} onChange={(event) => setDraftMin(digits(event.target.value))} className="field w-full bg-cream pr-9 text-[13px]"/>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m²</span>
        </div>
        <span className="text-muted-foreground">–</span>
        <div className="relative min-w-0 flex-1">
          <input type="text" inputMode="numeric" aria-label="Maximum area in square metres" placeholder="Max" value={draftMax} onChange={(event) => setDraftMax(digits(event.target.value))} className="field w-full bg-cream pr-9 text-[13px]"/>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m²</span>
        </div>
      </div>
      {invalid && <p className="mt-1.5 px-1 text-xs text-destructive">Minimum is higher than maximum - the values are treated as swapped.</p>}
    </div>
  );
}