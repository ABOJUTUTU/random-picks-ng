
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Random Picks NG",
  description: "Discover products worth picking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
