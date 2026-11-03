"use client";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, joinPhone } from "@/lib/country-codes";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  // Local number only (country code is chosen separately and joined on submit).
  phone: z
    .string()
    .trim()
    .min(5, "Enter a valid phone")
    .max(15, "Enter a valid phone")
    .regex(/^[\d\s\-()]+$/, "Enter a valid phone"),
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
        const fd = new FormData(form);
        const r = schema.safeParse(Object.fromEntries(fd));
        if (!r.success) {
          const errs: Record<string, string> = {};
          r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
          setErrors(errs);
          return;
        }
        setErrors({});
        setSubmitting(true);
        try {
          const phoneCountry = String(fd.get("phoneCountry") ?? DEFAULT_COUNTRY);
          // Strip a leading trunk 0 (e.g. 05x -> 5x) before attaching the dial code.
          const localNumber = r.data.phone.replace(/^0(?!0)/, "");
          const fullPhone = joinPhone(phoneCountry, localNumber);
          const res = await fetch("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...r.data,
              phone: fullPhone,
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
      <div>
        <input name="name" type="text" placeholder="Full name" className="field" />
        {errors["name"] && <p className="mt-2 px-4 text-sm text-destructive">{errors["name"]}</p>}
      </div>
      <div>
        <input name="email" type="email" placeholder="Email address" className="field" />
        {errors["email"] && <p className="mt-2 px-4 text-sm text-destructive">{errors["email"]}</p>}
      </div>
      <div>
        <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2">
          <div className="relative">
            <select
              name="phoneCountry"
              aria-label="Country code"
              defaultValue={DEFAULT_COUNTRY}
              className="field truncate !pr-10"
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {flagEmoji(c.iso)} {c.dial} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            aria-label="Phone number"
            placeholder="Phone number"
            className="field"
          />
        </div>
        {errors["phone"] && <p className="mt-2 px-4 text-sm text-destructive">{errors["phone"]}</p>}
      </div>
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