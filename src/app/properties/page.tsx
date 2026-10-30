import { Suspense } from "react";
import type { Metadata } from "next";
import { PropertiesPage } from "./properties-client";

export const metadata: Metadata = {
  title: "Properties for Sale in Saudi Arabia",
  description: "Browse villas, penthouses, apartments and commercial property for sale in Saudi Arabia.",
};

export default function PropertiesRoute() {
  return <Suspense fallback={<main className="min-h-screen px-4 pb-20 pt-28 md:px-6" />}><PropertiesPage /></Suspense>;
}
