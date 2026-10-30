import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { formatSAR, type Property } from "@/data/properties";

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link href={`/properties/${p.id}`} className="group block" data-reveal>
      <div className="relative aspect-[4/3.4] overflow-hidden rounded-[1.75rem] bg-secondary">
        <img src={p.images[0]} alt={p.title} loading="lazy" width={1024} height={800}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        <span className="absolute bottom-4 right-4 flex h-12 w-12 translate-y-3 scale-75 items-center justify-center rounded-full bg-background text-foreground opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="px-1 pt-5">
        <p className="text-2xl font-medium tracking-tight text-primary">{formatSAR(p.price)}</p>
        <h3 className="mt-1 text-lg font-medium leading-snug tracking-tight">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{p.district}, {p.city}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.short}</p>
        <div className="mt-4 flex items-center gap-5 whitespace-nowrap text-sm">
          <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-primary" />{p.area} m²</span>
          {p.beds > 0 && <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-primary" />{p.beds} Beds</span>}
          <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-primary" />{p.baths} Baths</span>
        </div>
      </div>
    </Link>
  );
}
