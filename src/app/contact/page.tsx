"use client";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/site/EnquiryForm";


const OFFICES = [
  ["Riyadh (HQ)", "King Fahd Rd, Al Olaya", 24.694, 46.685],
  ["Jeddah", "Corniche Rd, Al Shati", 21.597, 39.11],
  ["Dammam", "Prince Turki St, Corniche", 26.298, 50.218],
] as const;

function Contact() {
  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="display-xl"><span className="fancy">Talk</span> to us</h1>
        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">A private advisor will reply within 24 hours — or call us directly.</p>
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid content-start gap-4">
            {[[Phone, "Call", "+966 11 000 0000", "tel:+966110000000"], [Mail, "Email", "hello@najmestate.sa", "mailto:hello@najmestate.sa"], [Clock, "Hours", "Sun–Thu 9:00–21:00 · Fri–Sat by appointment", undefined]].map(([Icon, l, v, href]) => {
              const I = Icon as typeof Phone;
              return (
                <a key={l as string} href={href as string | undefined} className="flex items-center gap-5 rounded-[2rem] bg-cream p-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><I className="h-6 w-6" /></span>
                  <span><span className="block text-sm text-muted-foreground">{l as string}</span><span className="text-xl font-medium">{v as string}</span></span>
                </a>
              );
            })}
            <div className="grid gap-4 sm:grid-cols-3">
              {OFFICES.map(([c, a]) => (
                <div key={c} className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                  <p className="mt-6 text-lg font-medium">{c}</p>
                  <p className="opacity-75">{a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2.5rem] bg-background p-8 shadow-soft md:p-10">
            <h2 className="display-md mb-8">Send a <span className="fancy">message</span></h2>
            <EnquiryForm cta="Send message" />
          </div>
        </div>
        <div className="mt-14 h-[440px] overflow-hidden rounded-[2.5rem] bg-cream">
          <iframe title="Najm Estate Riyadh office map" src="https://maps.google.com/maps?q=24.694,46.685&z=13&output=embed" loading="lazy" className="h-full w-full" />
        </div>
      </div>
    </main>
  );
}

export default Contact;
