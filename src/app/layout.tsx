import type { Metadata } from "next";
import "../styles.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: { default: "Najm Estate — Premium Property in Saudi Arabia", template: "%s | Najm Estate" },
  description: "Najm Estate curates premium villas, residences and investment properties across Saudi Arabia.",
  openGraph: { title: "Najm Estate — Premium Property in Saudi Arabia", description: "Premium villas, residences and investment properties across Saudi Arabia.", type: "website" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppProviders>{children}</AppProviders></body></html>;
}
