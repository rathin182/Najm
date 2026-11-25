import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublicDestinations } from "@/lib/destinations";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const destinations = await getPublicDestinations();
  return (
    <main className="min-h-screen px-6 pb-20 pt-36">
      <div className="mx-auto max-w-[1400px]">
        <p className="mb-3 text-sm text-muted-foreground">Najm Estate</p>
        <h1 className="display-xl"><span className="fancy">Explore</span> destinations</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Discover the places connected to our curated collection of properties.</p>
        {destinations.length === 0 ? <p className="mt-12 rounded-3xl bg-cream p-8 text-muted-foreground">Destinations are being added. Please check back soon.</p> : (
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <Link key={destination.id} href={`/destinations/${destination.id}`} className="group block" data-reveal>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-cream">
                  {destination.image && <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                    <div><h2 className="text-3xl font-medium tracking-tight">{destination.name}</h2><p className="mt-1 text-sm text-white/80">{destination.propertyCount} {destination.propertyCount === 1 ? "property" : "properties"}</p></div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight className="h-5 w-5" /></span>
                  </div>
                </div>
                {destination.description && <p className="mt-4 line-clamp-2 px-1 text-sm text-muted-foreground">{destination.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
