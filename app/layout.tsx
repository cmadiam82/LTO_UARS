import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UARS · User Access Request System",
  description: "Secure, accountable access approvals from request to implementation.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "UARS · User Access Request System",
    description: "Secure access. Clear accountability.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "UARS secure six-step access approval workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UARS · User Access Request System",
    description: "Secure access. Clear accountability.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
