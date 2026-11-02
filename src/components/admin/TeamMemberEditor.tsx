"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import type { TeamMemberDraft } from "@/lib/team";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";

type Props = {
  member: TeamMemberDraft;
  busy: boolean;
  onClose: () => void;
  onSave: (member: TeamMemberDraft) => void;
};

export function TeamMemberEditor({ member, busy, onClose, onSave }: Props) {
  const [form, setForm] = useState<TeamMemberDraft>(member);
  const [uploading, setUploading] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.bio.trim() || !form.image.trim()) {
      toast.error("Name, role, description, and photo are required.");
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      imageAlt: form.imageAlt.trim() || form.name.trim(),
      specialty: form.specialty.trim(),
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
        throw new Error(result.error ?? "Could not upload this portrait.");
      }
      setForm((current) => ({
        ...current,
        image: result.url!,
        imageAlt: current.imageAlt || current.name,
      }));
      toast.success("Portrait uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload this portrait.");
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
            {form.id ? "Edit team member" : "Add team member"}
          </DialogTitle>
          <DialogDescription>
            Update the profile shown on the About page and homepage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Profile</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className="field"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Position">
                <input
                  className="field"
                  required
                  maxLength={120}
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  placeholder="e.g. Head of Private Clients"
                />
              </Field>
              <Field label="Joined Najm (optional)">
                <input
                  className="field"
                  type="date"
                  value={form.joinedAt}
                  onChange={(event) => setForm({ ...form, joinedAt: event.target.value })}
                />
              </Field>
              <Field label="Specialty (optional)">
                <input
                  className="field"
                  maxLength={160}
                  value={form.specialty}
                  onChange={(event) => setForm({ ...form, specialty: event.target.value })}
                  placeholder="e.g. Private acquisitions"
                />
              </Field>
              <Field label="Profile description" wide>
                <textarea
                  className="field min-h-32 resize-y rounded-[1.25rem]"
                  required
                  maxLength={2000}
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  placeholder="Professional background and what they do at Najm."
                />
                <span className="text-right text-xs text-muted-foreground">
                  {form.bio.length}/2000
                </span>
              </Field>
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <h3 className="font-medium">Portrait</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
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
                  {uploading ? "Uploading…" : "Upload portrait"}
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
                    placeholder="/images/team-member.jpg"
                  />
                </Field>
                <Field label="Image alt text">
                  <input
                    className="field"
                    maxLength={140}
                    value={form.imageAlt}
                    onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
                    placeholder={form.name || "Describe the portrait"}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-[1.25rem] bg-cream/60 p-4 sm:p-5">
            <Field label="Display order">
              <input
                className="field max-w-40"
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
              {busy ? "Saving…" : form.id ? "Save changes" : "Add member"}
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
