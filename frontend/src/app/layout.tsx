import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mr_Laptop.lk | Find Your Perfect Laptop in Sri Lanka",
  description: "Buy New, Used, and Refurbished Laptops at the Best Prices in Sri Lanka. Premium Gaming, Business, and Student Laptops with Warranty & Islandwide Delivery.",
  keywords: "Laptops Sri Lanka, Gaming Laptops Sri Lanka, Used Laptops Sri Lanka, Laptop Shop Sri Lanka, Apple, Dell, Lenovo, HP, Asus, Razer, Refurbished Laptops Colombo",
  authors: [{ name: "Mr_Laptop.lk" }],
  openGraph: {
    title: "Mr_Laptop.lk | Find Your Perfect Laptop in Sri Lanka",
    description: "Buy New, Used, and Refurbished Laptops with Warranty & Islandwide Delivery. Colombo's premium laptop store.",
    url: "https://mrlaptop.lk",
    siteName: "Mr_Laptop.lk",
    images: [
      {
        url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Mr_Laptop.lk - Premium Laptops Sri Lanka",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr_Laptop.lk | Find Your Perfect Laptop in Sri Lanka",
    description: "Premium Laptops with Warranty & Islandwide Delivery.",
    images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1200&auto=format&fit=crop"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
