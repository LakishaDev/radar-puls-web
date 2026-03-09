import type {Metadata} from "next";
import {Sora, Space_Mono} from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://radarpuls.com"),
  title: {
    default: "Radar Puls",
    template: "%s | Radar Puls",
  },
  description: "Radar Puls landing iskustvo za zajednicu vozaca.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr-Latn-RS" suppressHydrationWarning>
      <body className={`${sora.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
