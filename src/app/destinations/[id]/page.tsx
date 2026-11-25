import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PropertyCard } from "@/components/site/PropertyCard";
import { listingToProperty } from "@/lib/listing-property";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) notFound();
  const listings = await prisma.listing.findMany({
    where: { destinationId: id, status: "LIVE" },
    include: { media: { where: { kind: "IMAGE", status: "READY" }, orderBy: { position: "asc" } } },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
  });
  const properties = listings.map(listingToProperty);
  return (
    <main className="min-h-screen px-6 pb-20 pt-36">
      <div className="mx-auto max-w-[1400px]">
        <Link href="/destinations" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />All destinations</Link>
        {destination.image && <div className="relative mb-10 aspect-[21/8] overflow-hidden rounded-[2rem] bg-cream"><img src={destination.image} alt={destination.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><h1 className="absolute bottom-8 left-8 text-5xl font-medium text-white md:text-7xl">{destination.name}</h1></div>}
        {!destination.image && <h1 className="display-xl"><span className="fancy">{destination.name}</span></h1>}
        {destination.description && <p className="mt-5 max-w-3xl text-lg text-muted-foreground">{destination.description}</p>}
        <h2 className="display-md mt-14">Properties in {destination.name}</h2>
        {properties.length ? <div className="mt-8 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{properties.map((property) => <PropertyCard key={property.id} p={property} />)}</div> : <p className="mt-6 rounded-3xl bg-cream p-8 text-muted-foreground">There are no published properties in this destination yet.</p>}
      </div>
    </main>
  );
}
