"use client";
import { useState } from "react";
import { Check, ChevronDown, Home, Search, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_LABELS, type PropertyCategoryKey } from "@/lib/property-categories";

export type HeroOption = { value: string; label: string };

const TRIGGER = "group relative flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-background/60 md:rounded-full md:px-3 md:py-2 md:hover:bg-white/10";
const SEPARATOR = "md:before:absolute md:before:left-0 md:before:top-1/4 md:before:h-1/2 md:before:w-px md:before:bg-white/25";
const CONTENT = "z-[80] w-[var(--radix-popover-trigger-width)] min-w-60 rounded-xl border-border bg-background p-1.5 shadow-soft";
const ROW = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] hover:bg-primary/10";

function Trigger({ icon: Icon, label, summary, open, separator, }: {
  icon: LucideIcon;
  label: string;
  summary: string;
  open: boolean;
  separator: boolean;
}) {
  return (
    <PopoverTrigger asChild>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} className={`${TRIGGER} ${separator ? SEPARATOR : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-[10px] leading-none text-muted-foreground md:text-ink-foreground/75">{label}</span>
          <span className="mt-1 truncate text-xs font-medium text-foreground md:text-ink-foreground">{summary}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform md:text-ink-foreground ${open ? "rotate-180" : ""}`}
        />
      </button>
    </PopoverTrigger>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-1.5">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input type="text" autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full rounded-lg bg-cream py-2 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"/>
    </div>
  );
}


export function HeroDropdown({ icon, label, options, anyLabel, values, onChange, multiple = false, searchable = false, searchPlaceholder = "Search…", noun = "selected", separator = true, }: {
  icon: LucideIcon;
  label: string;
  options: HeroOption[];
  anyLabel: string;
  values: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  noun?: string;
  separator?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const has = (value: string) => values.some((item) => item.toLowerCase() === value.toLowerCase());
  const labelOf = (value: string) => options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label ?? value;
  const summary =
    values.length === 0 ? anyLabel : values.length <= 2 ? values.map(labelOf).join(", ") : `${values.length} ${noun}`;
  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle)) : options;

  const pick = (value: string) => {
    if (multiple) {
      onChange(has(value) ? values.filter((item) => item.toLowerCase() !== value.toLowerCase()) : [...values, value]);
    } else {
      onChange(has(value) ? [] : [value]);
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Trigger icon={icon} label={label} summary={summary} open={open} separator={separator} />
      <PopoverContent align="start" sideOffset={10} className={CONTENT}>
        {searchable && <SearchBox value={query} onChange={setQuery} placeholder={searchPlaceholder} />}
        <div role="listbox" aria-multiselectable={multiple} className="max-h-56 overflow-y-auto overscroll-contain">
          {!multiple && !needle && (
            <button
              type="button"
              role="option"
              aria-selected={values.length === 0}
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className={`${ROW} ${values.length === 0 ? "font-medium" : ""}`}
            >
              <span className="flex-1 truncate">{anyLabel}</span>
              {values.length === 0 && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          )}
          {visible.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-muted-foreground">
              {options.length === 0 ? "No options available" : `Nothing matches “${query.trim()}”`}
            </p>
          )}
          {visible.map((option) => {
            const checked = has(option.value);
            return (
              <button key={option.value} type="button" role="option" aria-selected={checked} onClick={() => pick(option.value)} className={`${ROW} ${!multiple && checked ? "font-medium" : ""}`}>
                {multiple && (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                )}
                <span className="flex-1 truncate">{option.label}</span>
                {!multiple && checked && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
        {multiple && values.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-lg border-t border-border px-2.5 pb-1 pt-2 text-left text-xs text-primary hover:underline"
          >
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function HeroPropertyType({ category, type, typesByCategory, onChange, separator = true, }: {
  category: PropertyCategoryKey | undefined;
  type: string;
  typesByCategory: Record<PropertyCategoryKey, HeroOption[]>;
  onChange: (category: PropertyCategoryKey | undefined, type: string) => void;
  separator?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(typesByCategory) as PropertyCategoryKey[];
  const options = category ? typesByCategory[category] : [];
  const typeLabel = options.find((option) => option.value === type)?.label ?? type;
  const summary = type ? typeLabel : category ? `All ${CATEGORY_LABELS[category].toLowerCase()} types` : "All types";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Trigger icon={Home} label="Property type" summary={summary} open={open} separator={separator} />
      <PopoverContent align="start" sideOffset={10} className={CONTENT}>
        <div className="flex gap-1 rounded-full bg-cream p-1">
          {keys.map((key) => (
            <button key={key} type="button" aria-pressed={category === key} onClick={() => onChange(category === key ? undefined : key, "")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[13px] transition-colors ${category === key ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
        <div role="listbox" className="mt-1.5 max-h-56 overflow-y-auto overscroll-contain">
          {!category ? (
            <p className="px-3 py-2 text-[13px] text-muted-foreground">Choose Residential or Commercial to pick a type.</p>
          ) : (
            <>
              <button type="button" role="option" aria-selected={!type}
                onClick={() => {
                  onChange(category, "");
                  setOpen(false);
                }}
                className={`${ROW} ${!type ? "font-medium" : ""}`}
              >
                <span className="flex-1 truncate">All {CATEGORY_LABELS[category].toLowerCase()} types</span>
                {!type && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
              {options.map((option) => (
                <button key={option.value} type="button" role="option" aria-selected={type === option.value}
                  onClick={() => {
                    onChange(category, option.value);
                    setOpen(false);
                  }}
                  className={`${ROW} ${type === option.value ? "font-medium" : ""}`}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {type === option.value && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}