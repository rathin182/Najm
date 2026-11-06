"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/lib/admin-store";
import {
  CATEGORY_GROUPS,
  HOME_SEARCH_GROUP_LABELS,
  HOME_SEARCH_GROUPS,
  PROPERTY_CATEGORIES,
  type HomeSearchGroup,
  type HomeSearchOptions,
  type SearchOption,
} from "@/lib/home-search-options";
import { CATEGORY_LABELS, type PropertyCategoryKey } from "@/lib/property-categories";

const EMPTY_OPTIONS: HomeSearchOptions = {
  locations: [],
  residentialTypes: [],
  commercialTypes: [],
  bedrooms: [],
  budgets: [],
  statuses: [],
};

// For these groups the filter value must equal the name stored on listings, so it simply follows the label.
const VALUE_FOLLOWS_LABEL: HomeSearchGroup[] = ["locations", "residentialTypes", "commercialTypes"];

async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeOptions(options: HomeSearchOptions): HomeSearchOptions {
  return Object.fromEntries(
    HOME_SEARCH_GROUPS.map((group) => [
      group,
      options[group].map(({ value, label }) => ({
        value: value.trim(),
        label: label.trim(),
      })),
    ]),
  ) as HomeSearchOptions;
}

export default function HomepageSearchFiltersPage() {
  const { can } = useAdmin();
  const [options, setOptions] = useState<HomeSearchOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<{
    group: HomeSearchGroup;
    index: number;
    id?: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch("/api/admin/home-search-options", {
          cache: "no-store",
        });
        const body = await readJson(response);

        if (!response.ok) {
          const message =
            typeof body === "object" && body && "error" in body
              ? String(body.error)
              : "Could not load homepage search options.";
          throw new Error(message);
        }

        setOptions(body as HomeSearchOptions);
      } catch (error) {
        const message = getErrorMessage(error, "Could not load homepage search options.");
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    void loadOptions();
  }, []);

  function updateOption(group: HomeSearchGroup, index: number, changes: Partial<SearchOption>) {
    setOptions((current) => ({
      ...current,
      [group]: current[group].map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option,
      ),
    }));
  }

  // function addOption(group: HomeSearchGroup) {
  //   setOptions((current) => ({
  //     ...current,
  //     [group]: [
  //       ...current[group],
  //       {
  //         label: "New option",
  //         // value: `new-option-${Date.now()}`,
  //         value: VALUE_FOLLOWS_LABEL.includes(group) ? "New option" : `new-option-${Date.now()}`,
  //       },
  //     ],
  //   }));
  // }
  function addOption(group: HomeSearchGroup) {
    setOptions((current) => ({
      ...current,
      [group]: [
        {
          label: "New option",
          value: VALUE_FOLLOWS_LABEL.includes(group) ? "New option" : `new-option-${Date.now()}`,
        },
        ...current[group],
      ],
    }));
  }

  function requestOptionDelete(group: HomeSearchGroup, index: number) {
    const option = options[group][index];
    setOptionToDelete({
      group,
      index,
      ...(option?.id ? { id: option.id } : {}),
      label: option?.label ?? "this option",
    });
  }

  function moveOption(group: HomeSearchGroup, index: number, direction: -1 | 1) {
    setOptions((current) => {
      const reordered = [...current[group]];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= reordered.length) {
        return current;
      }

      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex]!, reordered[index]!];

      return { ...current, [group]: reordered };
    });
  }

  async function saveOptions(nextOptions = options, showSuccess = true) {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/home-search-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextOptions),
      });
      const body = await readJson(response);

      if (!response.ok) {
        const message =
          typeof body === "object" && body && "error" in body
            ? String(body.error)
            : "Could not save homepage search options.";
        throw new Error(message);
      }

      const savedOptions = body as HomeSearchOptions;
      const savedValuesMatch =
        JSON.stringify(normalizeOptions(savedOptions)) ===
        JSON.stringify(normalizeOptions(nextOptions));

      if (!savedValuesMatch) {
        throw new Error(
          "The server returned different options than the ones submitted. Reload and try again.",
        );
      }

      setOptions(savedOptions);
      if (showSuccess) toast.success("Homepage search filters saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save homepage search options."));
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function confirmOptionDelete() {
    if (!optionToDelete) return;

    const { group, index, id, label } = optionToDelete;
    setSaving(true);

    try {
      if (id) {
        const query = new URLSearchParams({ id, group });
        const response = await fetch(`/api/admin/home-search-options?${query}`, {
          method: "DELETE",
        });
        const body = await readJson(response);

        if (!response.ok) {
          const message =
            typeof body === "object" && body && "error" in body
              ? String(body.error)
              : "Could not delete this search option.";
          throw new Error(message);
        }
      }

      setOptions((current) => ({
        ...current,
        [group]: current[group].filter((option, optionIndex) =>
          id ? option.id !== id : optionIndex !== index,
        ),
      }));
      setOptionToDelete(null);
      toast.success(`${label} deleted`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete this search option."));
    } finally {
      setSaving(false);
    }
  }

  if (!can.edit) {
    return (
      <p className="p-8 text-muted-foreground">
        You do not have permission to edit homepage search filters.
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Homepage search filters"
        sub="Manage the options shown to visitors in the homepage search. Changes save to the shared database."
        action={
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void saveOptions()}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />

      {loading ? (
        <Panel>Loading search options…</Panel>
      ) : loadError ? (
        <Panel>
          <div className="space-y-3">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Retry
            </button>
          </div>
        </Panel>
      ) : (
        HOME_SEARCH_GROUPS.filter((group) => group !== CATEGORY_GROUPS.residential && group !== CATEGORY_GROUPS.commercial).map((group) => (
          <SearchOptionGroup
            key={group}
            group={group}
            options={options[group]}
            onAdd={() => addOption(group)}
            onUpdate={(index, changes) => updateOption(group, index, changes)}
            onRemove={(index) => requestOptionDelete(group, index)}
            onMove={(index, direction) => moveOption(group, index, direction)}
          />
        ))
      )}

      {!loading && !loadError && (
        <section className="space-y-4 rounded-3xl bg-cream p-5 md:p-7">
          <div>
            <h2 className="text-xl font-medium">Property type</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select a category and manage its listing subtypes. The homepage and listing filters use these saved values.</p>
          </div>
          {PROPERTY_CATEGORIES.map((category) => {
            const group = CATEGORY_GROUPS[category];
            return (
              <SearchOptionGroup
                key={category}
                group={group}
                options={options[group]}
                onAdd={() => addOption(group)}
                onUpdate={(index, changes) => updateOption(group, index, changes)}
                onRemove={(index) => requestOptionDelete(group, index)}
                onMove={(index, direction) => moveOption(group, index, direction)}
                categoryLabel={CATEGORY_LABELS[category]}
              />
            );
          })}
        </section>
      )}

      <AlertDialog
        open={optionToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setOptionToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.25rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this search option?</AlertDialogTitle>
            <AlertDialogDescription>
              “{optionToDelete?.label}” will be removed from this filter and the database. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void confirmOptionDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Deleting…" : "Delete option"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function SearchOptionGroup({
  group,
  options,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  categoryLabel,
}: {
  group: HomeSearchGroup;
  options: SearchOption[];
  onAdd: () => void;
  onUpdate: (index: number, changes: Partial<SearchOption>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  categoryLabel?: string;
}) {
  const { title, hint } = HOME_SEARCH_GROUP_LABELS[group];
  const [open, setOpen] = useState(false);
  const heading = categoryLabel ? `${categoryLabel} types` : title;

  return (
    <section className="rounded-3xl bg-cream p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex flex-1 items-start gap-3 text-left">
          <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          <span>
            <span className="block text-xl font-medium">{heading} <span className="text-sm font-normal text-muted-foreground">({options.length})</span></span>
            <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setOpen(true); onAdd(); }}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add option
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-2">
          {options.length === 0 ? (
            <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">
              No options. Add one to show choices in this dropdown.
            </p>
          ) : (
            options.map((option, index) => (
              <SearchOptionRow
                key={`${group}-${index}`}
                option={option}
                index={index}
                count={options.length}
                valueFollowsLabel={VALUE_FOLLOWS_LABEL.includes(group)}
                onUpdate={(changes) => onUpdate(index, changes)}
                onRemove={() => onRemove(index)}
                onMove={(direction) => onMove(index, direction)}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function SearchOptionRow({
  option,
  index,
  count,
  valueFollowsLabel,
  onUpdate,
  onRemove,
  onMove,
}: {
  option: SearchOption;
  index: number;
  count: number;
  valueFollowsLabel: boolean;
  onUpdate: (changes: Partial<SearchOption>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    // <div className="grid gap-2 rounded-2xl bg-background p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
    <div className={`grid gap-2 rounded-2xl bg-background p-3 md:items-end ${valueFollowsLabel ? "md:grid-cols-[1fr_auto_auto]" : "md:grid-cols-[1fr_1fr_auto_auto]"}`}>  
      <label className="text-xs text-muted-foreground">
        Label
        <input
          className="field mt-1"
          value={option.label}
          // onChange={(event) => onUpdate({ label: event.target.value })}
          onChange={(event) => onUpdate(valueFollowsLabel ? { label: event.target.value, value: event.target.value } : { label: event.target.value })}
        />
      </label>

      {/* <label className="text-xs text-muted-foreground">
        Filter value
        <input
          className="field mt-1"
          value={option.value}
          onChange={(event) => onUpdate({ value: event.target.value })}
        />
      </label> */}

      {!valueFollowsLabel && (
        <label className="text-xs text-muted-foreground">
          Filter value
          <input
            className="field mt-1"
            value={option.value}
            onChange={(event) => onUpdate({ value: event.target.value })}
          />
        </label>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="rounded-full px-3 py-2 text-sm disabled:opacity-30"
          aria-label={`Move ${option.label} up`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
          className="rounded-full px-3 py-2 text-sm disabled:opacity-30"
          aria-label={`Move ${option.label} down`}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${option.label}`}
        className="flex h-10 items-center justify-center rounded-full px-3 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
