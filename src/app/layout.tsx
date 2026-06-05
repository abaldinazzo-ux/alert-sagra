import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alert Sagra",
  description: "Sistema di notifiche per la gestione della sagra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
