import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { Providers } from "./providers";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const AUTHED_HINT = `try{for(var k in localStorage)if(k.indexOf("__convexAuthJWT_")===0||k.indexOf("__convexAuthRefreshToken_")===0){document.documentElement.dataset.authed="1";break}}catch(e){}`;

const TITLE = "Drishti: competitor research for Indian D2C beauty brands";
const DESCRIPTION =
  "Competitor research for Indian D2C skincare and beauty brands. Reads public Google, YouTube and news data and links every number to its source.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Drishti" },
  description: DESCRIPTION,
  applicationName: "Drishti",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Drishti",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="authed-hint" strategy="beforeInteractive">
          {AUTHED_HINT}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
