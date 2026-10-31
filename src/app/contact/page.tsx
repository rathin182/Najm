"use client";
import { useEffect, useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { DEFAULT_CONTACT_SETTINGS, getMapUrl, type ContactSettingsData } from "@/lib/contact-settings";

const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

function Contact() {
  // Defaults render instantly; admin-edited values replace them once loaded.
  const [s, setS] = useState<ContactSettingsData>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    fetch("/api/contact-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ContactSettingsData | null) => d && setS(d))
      .catch(() => {});
  }, []);

  const mapUrl = getMapUrl(s);
  const rows = [
    s.phone && { Icon: Phone, label: "Call", value: s.phone, href: telHref(s.phone) },
    s.email && { Icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` },
    s.hours && { Icon: Clock, label: "Hours", value: s.hours, href: undefined },
  ].filter(Boolean) as { Icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="display-xl"><span className="fancy">Talk</span> to us</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">A private advisor will reply within 24 hours — or call us directly.</p>
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-4">
            {rows.map(({ Icon, label, value, href }) => (
              <a key={label} href={href} className="flex items-center gap-5 rounded-[2rem] bg-cream p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="h-6 w-6" /></span>
                <span><span className="block text-sm text-muted-foreground">{label}</span><span className="text-xl font-medium">{value}</span></span>
              </a>
            ))}
            {s.offices.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {s.offices.map((o, i) => (
                  <div key={`${o.city}-${i}`} className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
                    <MapPin className="h-5 w-5" />
                    <p className="mt-6 text-lg font-medium">{o.city}</p>
                    <p className="opacity-75">{o.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[2.5rem] bg-background p-8 shadow-soft md:p-10">
            <h2 className="display-md mb-8">Send a <span className="fancy">message</span></h2>
            <EnquiryForm cta="Send message" />
          </div>
        </div>
        {mapUrl && (
          <div className="mt-14 h-[440px] overflow-hidden rounded-[2.5rem] bg-cream">
            <iframe key={mapUrl} title={s.mapTitle} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-full w-full border-0" />
          </div>
        )}
      </div>
    </main>
  );
}

export default Contact;