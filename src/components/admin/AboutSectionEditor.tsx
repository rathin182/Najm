"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { ImagePlus, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  ABOUT_HERO_DESTINATIONS,
  ABOUT_SECTION_TYPES,
  type AboutSectionDraft,
  type AboutSectionItem,
} from "@/lib/about-sections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavingOverlay } from "@/components/admin/EditorParts";

type Props = {
  section: AboutSectionDraft;
  busy: boolean;
  onClose: () => void;
  onSave: (section: AboutSectionDraft) => void;
};

const ITEM_DEFAULTS: Record<"VALUE_CARDS" | "JOURNEY_TIMELINE", AboutSectionItem> = {
  VALUE_CARDS: { title: "", description: "" },
  JOURNEY_TIMELINE: { title: "", description: "" },
};

export function AboutSectionEditor({ section, busy, onClose, onSave }: Props) {
  const [form, setForm] = useState<AboutSectionDraft>(section);
  const [uploading, setUploading] = useState(false);
  const sectionName =
    ABOUT_SECTION_TYPES.find((option) => option.value === form.type)?.label ?? "About section";
  const hasItems = form.type === "VALUE_CARDS" || form.type === "JOURNEY_TIMELINE";
  const hasButton = form.type === "HERO_IMAGE" || form.type === "CTA_BANNER";
  const requiresButton = form.type === "CTA_BANNER";

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.type === "HERO_IMAGE" && !form.image.trim()) {
      toast.error("Choose or upload an image for this section.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Add a section heading.");
      return;
    }
    if (hasItems && form.items.length === 0) {
      toast.error("Add at least one item to this section.");
      return;
    }
    if (requiresButton && (!form.buttonDestination || !form.buttonLabel.trim())) {
      toast.error("Choose a button destination and enter its label.");
      return;
    }
    if (form.buttonDestination && !form.buttonLabel.trim()) {
      toast.error("Add a label for the selected button destination.");
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      imageAlt: form.imageAlt.trim() || form.title.trim(),
      buttonLabel: form.buttonDestination ? form.buttonLabel.trim() : "",
      items: form.items.map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      })),
    });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = (await response.json()) as { url?: string; kind?: string; error?: string };
      if (!response.ok || result.kind !== "image" || !result.url) {
        throw new Error(result.error ?? "Could not upload this section image.");
      }
      setForm((current) => ({
        ...current,
        image: result.url!,
        imageAlt: current.imageAlt || current.title,
      }));
      toast.success("Section image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload this section image.");
    } finally {
      setUploading(false);
    }
  };

  const updateItem = (index: number, patch: Partial<AboutSectionItem>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy && !uploading) onClose();
      }}
    >
      {(busy || uploading) && <SavingOverlay label={uploading ? "Uploading image…" : form.id ? "Saving changes…" : "Adding section…"} />}
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {form.id ? `Edit ${sectionName.toLowerCase()}` : `Add ${sectionName.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            Section type: {sectionName}. The About page uses its matching layout.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Section content</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Display order">
                <input
                  className="field"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.order}
                  onChange={(event) =>
                    setForm({ ...form, order: Math.max(1, Number(event.target.value)) })
                  }
                />
              </Field>
              <Field label={form.type === "JOURNEY_TIMELINE" ? "Section heading" : "Heading"} wide>
                <input
                  className="field"
                  required
                  maxLength={160}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder={
                    form.type === "JOURNEY_TIMELINE"
                      ? "Our journey"
                      : form.type === "VALUE_CARDS"
                        ? "Our values"
                        : form.type === "CTA_BANNER"
                          ? "Let's find your address."
                          : "A Saudi story of homes and trust."
                  }
                />
              </Field>
              {(form.type === "HERO_IMAGE" || form.type === "CTA_BANNER") && (
                <Field label="Description (optional)" wide>
                  <textarea
                    className="field min-h-28 resize-y rounded-[1.25rem]"
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Add supporting text for this section."
                  />
                </Field>
              )}
            </div>
          </section>

          {hasItems && (
            <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">
                    {form.type === "VALUE_CARDS" ? "Value cards" : "Timeline milestones"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {form.type === "VALUE_CARDS"
                      ? "Each item becomes a value card."
                      : "Each item becomes a milestone card, in the order shown."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [
                        ...form.items,
                        { ...ITEM_DEFAULTS[form.type as "VALUE_CARDS" | "JOURNEY_TIMELINE"] },
                      ],
                    })
                  }
                  className="flex shrink-0 items-center gap-2 rounded-full bg-background px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </button>
              </div>
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="rounded-xl bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {form.type === "VALUE_CARDS"
                          ? `Value ${index + 1}`
                          : `Milestone ${index + 1}`}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove item ${index + 1}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            items: form.items.filter((_, itemIndex) => itemIndex !== index),
                          })
                        }
                        className="rounded-full p-2 text-destructive hover:bg-cream"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={form.type === "VALUE_CARDS" ? "Value title" : "Year or date"}>
                        <input
                          className="field"
                          required
                          maxLength={120}
                          value={item.title}
                          onChange={(event) => updateItem(index, { title: event.target.value })}
                          placeholder={
                            form.type === "VALUE_CARDS" ? "e.g. Discretion" : "e.g. 2008"
                          }
                        />
                      </Field>
                      <Field label={form.type === "VALUE_CARDS" ? "Description" : "Milestone"}>
                        <textarea
                          className="field min-h-24 resize-y rounded-[1.25rem]"
                          required
                          maxLength={1000}
                          value={item.description}
                          onChange={(event) =>
                            updateItem(index, { description: event.target.value })
                          }
                          placeholder={
                            form.type === "VALUE_CARDS"
                              ? "Describe this value"
                              : "Describe what happened"
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {form.type === "HERO_IMAGE" && (
            <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
              <h3 className="font-medium">Hero image</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt={form.imageAlt || form.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-background px-4 py-2.5 text-sm hover:bg-primary hover:text-primary-foreground">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void uploadImage(file);
                      }}
                    />
                  </label>
                  <Field label="Image URL">
                    <input
                      className="field"
                      required
                      value={form.image}
                      onChange={(event) => setForm({ ...form, image: event.target.value })}
                      placeholder="/images/about.jpg"
                    />
                  </Field>
                  <Field label="Image alt text (optional)">
                    <input
                      className="field"
                      maxLength={140}
                      value={form.imageAlt}
                      onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
                      placeholder={form.title || "Describe the image"}
                    />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {hasButton && (
            <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
              <h3 className="font-medium">Button {requiresButton ? "" : "(optional)"}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Button destination">
                  <select
                    className="field"
                    value={form.buttonDestination}
                    onChange={(event) => {
                      const destination = ABOUT_HERO_DESTINATIONS.find(
                        (item) => item.value === event.target.value,
                      );
                      setForm({
                        ...form,
                        buttonDestination: event.target.value,
                        buttonLabel: event.target.value
                          ? form.buttonLabel || destination?.buttonLabel || ""
                          : "",
                      });
                    }}
                  >
                    {ABOUT_HERO_DESTINATIONS.filter(
                      (destination) => !requiresButton || destination.value,
                    ).map((destination) => (
                      <option key={destination.value || "none"} value={destination.value}>
                        {destination.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Button label">
                  <input
                    className="field"
                    maxLength={80}
                    disabled={!form.buttonDestination}
                    value={form.buttonLabel}
                    onChange={(event) => setForm({ ...form, buttonLabel: event.target.value })}
                    placeholder="e.g. Talk to an advisor"
                  />
                </Field>
              </div>
            </section>
          )}

          <DialogFooter className="gap-2">
            <button type="button" onClick={onClose} className="rounded-full bg-cream px-5 py-3">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || uploading}
              className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-ink disabled:opacity-60"
            >
              {busy ? "Saving…" : form.id ? "Save changes" : "Add section"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="px-1 text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
