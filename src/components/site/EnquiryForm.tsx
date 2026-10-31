"use client";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  message: z.string().trim().max(1000).optional(),
});

export function EnquiryForm({
  cta = "Send enquiry",
  defaultMessage = "",
  propertyId,
  propertyTitle,
}: {
  cta?: string;
  defaultMessage?: string;
  /** Slug/id of the property this enquiry is for. Omit for general contact forms. */
  propertyId?: string;
  propertyTitle?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        const form = e.currentTarget;
        const r = schema.safeParse(Object.fromEntries(new FormData(form)));
        if (!r.success) {
          const errs: Record<string, string> = {};
          r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
          setErrors(errs);
          return;
        }
        setErrors({});
        setSubmitting(true);
        try {
          const res = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...r.data,
              message: r.data.message || undefined,
              // The API requires a property reference; general forms are tagged "general-enquiry".
              propertySlug: propertyId ?? "general-enquiry",
              propertyTitle: propertyTitle ?? (propertyId ? undefined : "General enquiry"),
              source: "property-page",
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => null);
            throw new Error(body?.error ?? "Something went wrong. Please try again.");
          }
          form.reset();
          toast.success("Thank you — an advisor will contact you within 24 hours.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {(["name", "email", "phone"] as const).map((f) => (
        <div key={f}>
          <input
            name={f}
            type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
            placeholder={f === "name" ? "Full name" : f === "email" ? "Email address" : "Phone (+966)"}
            className="field"
          />
          {errors[f] && <p className="mt-2 px-4 text-sm text-destructive">{errors[f]}</p>}
        </div>
      ))}
      <textarea name="message" rows={4} defaultValue={defaultMessage} placeholder="How can we help?" className="field resize-none rounded-[1.75rem]" />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg text-primary-foreground transition-colors hover:bg-ink disabled:opacity-60"
      >
        {submitting ? "Sending…" : cta} <ArrowUpRight className="h-5 w-5" />
      </button>
    </form>
  );
}