import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { queryListingsPage } from "@/lib/listings-query";
import { normalizeQuery, toListingApiParams } from "@/lib/listing-search-params";
import { PropertiesPage } from "./properties-client";

export const metadata: Metadata = {
  title: "Properties for Sale in Saudi Arabia",
  description: "Browse villas, penthouses, apartments and commercial property for sale in Saudi Arabia.",
};

export default async function PropertiesRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  let initial;
  try {
    const session = await auth();
    const data = await queryListingsPage(toListingApiParams(query.toString(), 1), session?.user.role === "ADMIN");
    initial = { query: normalizeQuery(query.toString()), data };
  } catch (error) {
    console.error("Properties prefetch failed; client will fetch instead", error);
  }
  return <Suspense fallback={<main className="min-h-screen px-4 pb-20 pt-28 md:px-6" />}><PropertiesPage initial={initial} /></Suspense>;
}