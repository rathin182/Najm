"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { FUTURE_PROJECT_STATUSES, type FutureProjectDraft } from "@/lib/future-projects";
import { formatBudget } from "@/lib/future-projects";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Props = {
  project: FutureProjectDraft;
  busy: boolean;
  onClose: () => void;
  onSave: (project: FutureProjectDraft) => void;
};

export function FutureProjectEditor({ project, busy, onClose, onSave }: Props) {
  const [form, setForm] = useState<FutureProjectDraft>(project);
  const [uploading, setUploading] = useState(false);
  const isEditing = Boolean(form.id);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.region.trim() || !form.text.trim() || !form.image.trim()) {
      toast.error("Complete the project details and add a cover image.");
      return;
    }
    if (form.budget !== null && (!Number.isFinite(form.budget) || form.budget <= 0)) {
      toast.error("Budget must be a positive SAR amount, or left blank.");
      return;
    }
    if ((form.latitude === null) !== (form.longitude === null)) {
      toast.error("Enter both map coordinates, or leave both blank.");
      return;
    }
    if (
      (form.latitude !== null && (form.latitude < -90 || form.latitude > 90)) ||
      (form.longitude !== null && (form.longitude < -180 || form.longitude > 180))
    ) {
      toast.error("Enter valid latitude and longitude coordinates.");
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      region: form.region.trim(),
      text: form.text.trim(),
    });
  };

  const uploadCover = async (file: File) => {
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
        throw new Error(result.error ?? "Could not upload the cover image.");
      }
      setForm((current) => ({
        ...current,
        image: result.url!,
        imageAlt: current.imageAlt || current.name,
      }));
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the cover image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy && !uploading) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[1.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Edit future project" : "Add future project"}
          </DialogTitle>
          <DialogDescription>
            Manage the project card shown in the future projects section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Project details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Project name">
                <input
                  className="field"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. NEOM — The Line"
                />
              </Field>
              <Field label="Region">
                <input
                  className="field"
                  required
                  maxLength={100}
                  value={form.region}
                  onChange={(event) => setForm({ ...form, region: event.target.value })}
                  placeholder="e.g. Tabuk Province"
                />
              </Field>
              <Field label="Project status">
                <select
                  className="field"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as FutureProjectDraft["status"] })
                  }
                >
                  {FUTURE_PROJECT_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estimated deadline date (optional)">
                <input
                  className="field"
                  type="date"
                  value={form.deadlineDate}
                  onChange={(event) => {
                    const legacyNote = form.deadlineNote.match(/^\d{4}(?:\s*\((.*)\))?$/);
                    setForm({
                      ...form,
                      deadlineDate: event.target.value,
                      deadlineNote: legacyNote ? (legacyNote[1] ?? "") : form.deadlineNote,
                    });
                  }}
                />
              </Field>
              <Field label="Deadline note (optional)">
                <input
                  className="field"
                  maxLength={80}
                  value={form.deadlineNote}
                  onChange={(event) => setForm({ ...form, deadlineNote: event.target.value })}
                  placeholder="e.g. Phase one or full completion"
                />
              </Field>
              <Field label="Budget in SAR (optional)">
                <input
                  className="field"
                  type="number"
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  value={form.budget ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      budget: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  placeholder="e.g. 1900000000000"
                />
                <span className="px-1 text-xs text-muted-foreground">
                  {form.budget === null
                    ? "No budget provided"
                    : `Displays as ${formatBudget(form.budget)}`}
                </span>
              </Field>
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
              <Field label="Short description" wide>
                <textarea
                  className="field min-h-28 resize-y rounded-[1.25rem]"
                  required
                  maxLength={260}
                  value={form.text}
                  onChange={(event) => setForm({ ...form, text: event.target.value })}
                  placeholder="A concise description for the project card."
                />
                <span className="text-right text-xs text-muted-foreground">
                  {form.text.length}/260
                </span>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Project location</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional representative pin for a project that may cover a wider area.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Latitude">
                <input
                  className="field"
                  type="number"
                  min={-90}
                  max={90}
                  step="any"
                  value={form.latitude ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      latitude: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  placeholder="e.g. 24.7136"
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="field"
                  type="number"
                  min={-180}
                  max={180}
                  step="any"
                  value={form.longitude ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      longitude: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  placeholder="e.g. 46.6753"
                />
              </Field>
              {form.latitude !== null && form.longitude !== null && (
                <div className="overflow-hidden rounded-xl sm:col-span-2">
                  <iframe
                    key={`${form.latitude},${form.longitude}`}
                    title="Project map preview"
                    className="h-56 w-full"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=8&output=embed`}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Cover image</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.imageAlt || form.name}
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
                  {uploading ? "Uploading…" : "Upload cover"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadCover(file);
                    }}
                  />
                </label>
                <Field label="Image URL">
                  <input
                    className="field"
                    required
                    value={form.image}
                    onChange={(event) => setForm({ ...form, image: event.target.value })}
                    placeholder="/images/project.jpg"
                  />
                </Field>
                <Field label="Image alt text">
                  <input
                    className="field"
                    maxLength={140}
                    value={form.imageAlt}
                    onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
                    placeholder={form.name || "Describe the project image"}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <span>
              <span className="block font-medium">Published</span>
              <span className="text-sm text-muted-foreground">
                Published projects appear on the homepage; drafts stay in the admin.
              </span>
            </span>
            <Switch
              checked={form.published}
              onCheckedChange={(published) => setForm({ ...form, published })}
              aria-label="Published"
            />
          </section>
          <DialogFooter className="gap-2">
            <button type="button" onClick={onClose} className="rounded-full bg-cream px-5 py-3">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || uploading}
              className="rounded-full bg-primary px-6 py-3 text-primary-foreground hover:bg-ink disabled:opacity-60"
            >
              {busy ? "Saving…" : isEditing ? "Save changes" : "Add project"}
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
