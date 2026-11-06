import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "sudo get big — Root Access to Gains";
const description =
  "Your physique is running on limited privileges. A Linux terminal for getting absolutely massive: sudo get big, apt install delts, and a calves package that has never been found.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sudogetbig.com"),
  title: { default: title, template: "%s · sudo get big" },
  description,
  applicationName: "sudo get big",
  keywords: ["sudo get big", "linux humor", "gym humor", "developer humor", "terminal", "bodybuilding", "sudogetbig"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://sudogetbig.com",
    siteName: "sudo get big",
    title,
    description: "ROOT ACCESS TO GAINS. A working terminal for escalating your physique. Calves not supported.",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "ROOT ACCESS TO GAINS. A working terminal for escalating your physique. Calves not supported.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
