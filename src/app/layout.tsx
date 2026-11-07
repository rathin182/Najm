import type { Metadata } from "next";
import "../styles.css";
import { AppProviders } from "./providers";
import { DM_Sans, Pinyon_Script, Playfair_Display } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-dm-sans" });
const pinyonScript = Pinyon_Script({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-pinyon-script" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], weight: "400", display: "auto", style: "italic", variable: "--font-playfair-display" });


export const metadata: Metadata = {
  title: { default: "Najm Estate — Premium Property in Saudi Arabia", template: "%s | Najm Estate" },
  description: "Najm Estate curates premium villas, residences and investment properties across Saudi Arabia.",
  openGraph: { title: "Najm Estate — Premium Property in Saudi Arabia", description: "Premium villas, residences and investment properties across Saudi Arabia.", type: "website" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // <html lang="en" suppressHydrationWarning>
    <html lang="en" className={`${dmSans.variable} ${pinyonScript.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: returning visitors never see the intro loader cover. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("najm:intro-seen")==="1")document.documentElement.classList.add("intro-seen")}catch(e){}`,
          }}
        />
      </head>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}