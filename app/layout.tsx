import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LTOCM · LTO Credentials Management",
  description: "Secure, accountable LTO credentials management from request to implementation.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "LTOCM · LTO Credentials Management",
    description: "Secure credentials. Clear accountability.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "LTOCM secure credentials approval workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LTOCM · LTO Credentials Management",
    description: "Secure credentials. Clear accountability.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
