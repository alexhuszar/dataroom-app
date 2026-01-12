import type { Metadata } from "next";
import { Inter } from 'next/font/google'

import "./globals.css";
import { AppProviders } from "@/lib/contexts/AppProviders";

const customFont = Inter({
    subsets: ['latin'],
    weight: ['100','200', '300', '400', '500','600', '700', '800', '900'],
    variable: '--inter',
})

export const metadata: Metadata = {
  title: "DataRoom",
  description: "DataRoom - The only storage solution you need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${customFont.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
