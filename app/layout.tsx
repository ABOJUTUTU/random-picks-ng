
import type { Metadata } from "next";
import ShoppingAssistant from "./components/shopping-assistant";
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
      <body>
        {children}
        <ShoppingAssistant />
      </body>
    </html>
  );
}
