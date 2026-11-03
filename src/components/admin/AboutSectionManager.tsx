"use client";
import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AboutSectionEditor } from "@/components/admin/AboutSectionEditor";
import TeamManager from "@/components/admin/TeamManager";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import {
  ADDABLE_ABOUT_SECTION_TYPES,
  ABOUT_SECTION_TYPES,
  type AddableAboutSectionType,
  type AboutSection,
  type AboutSectionDraft,
} from "@/lib/about-sections";
import { useAdmin } from "@/lib/admin-store";

function emptySection(type: AddableAboutSectionType, order: number): AboutSectionDraft {
  return {
    type,
    title: "",
    description: "",
    image: "",
    imageAlt: "",
    buttonLabel: type === "CTA_BANNER" ? "Talk to an advisor" : "",
    buttonDestination: type === "CTA_BANNER" ? "/contact" : "",
    items: [],
    order,
  };
}

type ApiError = {
  error?: string;
  issues?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
};

export default function AboutSectionManager() {
  const { can } = useAdmin();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [editing, setEditing] = useState<AboutSectionDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AboutSection | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/admin/about/sections", {
        credentials: "include",
        cache: "no-store",
      });
      const result = (await response.json()) as AboutSection[] | ApiError;
      if (!response.ok || !Array.isArray(result))
        throw new Error(!Array.isArray(result) ? result.error : "Could not load About sections.");
      setSections(result);
      setLoadError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load About sections.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (section: AboutSectionDraft) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/about/sections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });
      const result = (await response.json()) as AboutSection | ApiError;
      if (!response.ok || !("id" in result)) {
        const apiError = result as ApiError;
        const fieldErrors = Object.entries(apiError.issues?.fieldErrors ?? {}).flatMap(
          ([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`),
        );
        throw new Error(
          [...(apiError.issues?.formErrors ?? []), ...fieldErrors].join(" ") ||
            apiError.error ||
            "Could not save this section.",
        );
      }
      await load();
      setEditing(null);
      toast.success(section.id ? "About section updated" : "About section added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this section.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (section: AboutSection) => {
    if (!can.delete) return;
    try {
      const response = await fetch(`/api/admin/about/sections/${encodeURIComponent(section.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        throw new Error(result.error ?? "Could not delete this section.");
      }
      setSections((current) => current.filter((item) => item.id !== section.id));
      toast.success("About section removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this section.");
    }
  };

  return (
    <div>
      <PageHeader title="About" sub="Manage the content shown on the About page." />

      <section aria-labelledby="about-sections-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="about-sections-heading" className="text-2xl font-medium">
              Sections
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, remove, and order the editable About sections.
            </p>
          </div>
          {can.edit && (
            <button
              type="button"
              onClick={() => setTypePickerOpen(true)}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:bg-ink"
            >
              <Plus className="h-4 w-4" />
              Add section
            </button>
          )}
        </div>

        {!ready ? (
          <Panel>Loading About sections…</Panel>
        ) : loadError ? (
          <Panel>
            {loadError}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 text-primary underline"
            >
              Retry
            </button>
          </Panel>
        ) : sections.length === 0 ? (
          <Panel>No About sections yet.</Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...sections]
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <Panel key={section.id} className="!p-3">
                  <div className="relative aspect-[16/8] overflow-hidden rounded-[1.25rem] bg-cream">
                    {section.image ? (
                      <img
                        src={section.image}
                        alt={section.imageAlt || section.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : section.type === "TEAM" ? (
                      <div className="flex h-full flex-col items-center justify-center bg-cream text-muted-foreground">
                        <p className="text-lg font-medium">Team profiles</p>
                        <p className="text-sm">Managed below</p>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-medium">
                      {String(section.order).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-primary">
                      {ABOUT_SECTION_TYPES.find((type) => type.value === section.type)?.label ??
                        "Hero image section"}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-medium">
                      {section.title ||
                        ABOUT_SECTION_TYPES.find((type) => type.value === section.type)?.label}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {section.type === "TEAM"
                        ? "Team profiles are managed in the Team section below."
                        : section.items.length > 0
                          ? `${section.items.length} content items`
                          : section.description}
                    </p>
                    <div className="mt-4 flex justify-end gap-2 border-t border-cream pt-3">
                      {section.type !== "TEAM" && can.edit && (
                        <button
                          type="button"
                          onClick={() => setEditing(section)}
                          aria-label={`Edit ${section.type} section`}
                          className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {section.type !== "TEAM" && can.delete && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(section)}
                          aria-label={`Delete ${section.type} section`}
                          className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <TeamManager embedded />
      </section>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.25rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete About section?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title
                ? `“${pendingDelete.title}” will be removed from the About page.`
                : "This section will be removed from the About page."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) void remove(pendingDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editing && (
        <AboutSectionEditor
          key={editing.id ?? "new-about-section"}
          section={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent className="max-w-2xl rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose a section type</DialogTitle>
            <DialogDescription>Select the kind of content you want to add to About.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {ADDABLE_ABOUT_SECTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setTypePickerOpen(false);
                  setEditing(
                    emptySection(
                      type.value,
                      Math.max(0, ...sections.map((section) => section.order)) + 1,
                    ),
                  );
                }}
                className="rounded-xl border border-border bg-cream/60 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="block font-medium">{type.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {type.value === "HERO_IMAGE" &&
                    "Large image with optional heading, description, and button."}
                  {type.value === "VALUE_CARDS" && "A heading followed by a set of value cards."}
                  {type.value === "JOURNEY_TIMELINE" && "A heading followed by dated milestones."}
                  {type.value === "CTA_BANNER" &&
                    "A closing message with a button to an approved destination."}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
