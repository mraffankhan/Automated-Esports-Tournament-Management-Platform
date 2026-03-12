import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARGON BOT | The Next Generation Discord Bot",
  description: "Powerful moderation, security and automation for your server.",
  keywords: ["argon bot", "ravonix", "ravonix bot", "ravonixx", "discord bot", "discord moderation bot", "esports discord bot"],
  authors: [{ name: "RAVONIXX", url: "https://ravonixx.xyz" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen flex flex-col selection:bg-primary/30 selection:text-white`}>
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
