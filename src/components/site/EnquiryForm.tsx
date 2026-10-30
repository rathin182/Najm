import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";
import { pushEnquiry } from "@/lib/admin-store";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  message: z.string().trim().max(1000).optional(),
});

export function EnquiryForm({ cta = "Send enquiry", defaultMessage = "", source, propertyId }: { cta?: string; defaultMessage?: string; source?: string; propertyId?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        const r = schema.safeParse(data);
        if (!r.success) {
          const errs: Record<string, string> = {};
          r.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
          setErrors(errs);
          return;
        }
        setErrors({});
        pushEnquiry({ ...r.data, message: r.data.message ?? "", source: source ?? (typeof window !== "undefined" ? window.location.pathname : "Website"), propertyId });
        form.reset();
        toast.success("Thank you — an advisor will contact you within 24 hours.");
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
      <button type="submit" className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg text-primary-foreground transition-colors hover:bg-ink">
        {cta} <ArrowUpRight className="h-5 w-5" />
      </button>
    </form>
  );
}
