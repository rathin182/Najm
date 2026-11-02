"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
const office = '/images/office.jpg';
import { TeamMembers } from "@/components/site/TeamMembers";
import { useReveal } from "@/components/site/motion";


const VALUES = [
  ["Discretion", "Private releases and off-market homes are handled with complete confidentiality."],
  ["Verification", "Every deed, permit and licence is checked against Ejar and REGA before we show a home."],
  ["Long view", "We advise as if we'll know you for decades — because most of our clients return."],
];
const MILESTONES = [
  ["2008", "Founded in Riyadh as a two-person villa brokerage."],
  ["2014", "Opened Jeddah office and launched property management."],
  ["2019", "Investment Vault launched for yield-focused buyers."],
  ["2023", "Official advisory partner for giga-project residences."],
  ["2026", "SAR 6B transacted and 2,400+ clients housed."],
];

function About() {
  useReveal();
  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="display-xl max-w-5xl" data-reveal>A <span className="fancy">Saudi</span> story of homes and trust.</h1>
        <p className="mt-8 max-w-2xl text-xl text-muted-foreground" data-reveal>
          Najm means “star”. Since 2008 we have guided families, founders and global investors to the addresses that shape their lives across the Kingdom.
        </p>
        <div className="mt-14 aspect-[16/8] overflow-hidden rounded-[2.5rem]" data-reveal>
          <img src={office} alt="Najm Estate Riyadh office" width={1600} height={1008} className="h-full w-full object-cover" />
        </div>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {VALUES.map(([t, d]) => (
            <div key={t} className="rounded-[2rem] bg-cream p-8" data-reveal>
              <p className="display-md text-primary">{t}</p>
              <p className="mt-4 text-lg text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-28">
          <h2 className="display-lg" data-reveal>Our <span className="fancy">journey</span></h2>
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {MILESTONES.map(([y, t]) => (
              <div key={y} className="rounded-[2rem] bg-primary p-7 text-primary-foreground" data-reveal>
                <p className="text-4xl font-medium">{y}</p>
                <p className="mt-6 opacity-80">{t}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-28">
          <h2 className="display-lg" data-reveal>Meet the <span className="fancy">team</span></h2>
          <div className="mt-12">
            <TeamMembers />
          </div>
        </section>

        <section className="mt-28 flex flex-col items-start justify-between gap-8 rounded-[2.5rem] bg-cream p-10 md:flex-row md:items-center md:p-16" data-reveal>
          <h2 className="display-lg max-w-2xl">Let's find your <span className="fancy">address</span>.</h2>
          <Link href="/contact" className="flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-lg text-ink-foreground hover:bg-primary">Talk to an advisor <ArrowUpRight className="h-5 w-5" /></Link>
        </section>
      </div>
    </main>
  );
}

export default About;
