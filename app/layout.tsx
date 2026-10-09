import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sabi-psi.vercel.app"),
  title: "Sabi | Find a tech skill that fits you",
  description:
    "A friendly guide for young Nigerians to match their strengths and interests with a tech skill to explore. No experience needed—start with what you have.",
  openGraph: {
    type: "website",
    url: "https://sabi-psi.vercel.app",
    siteName: "Sabi",
    locale: "en_NG",
    title: "Sabi | Find a tech skill that fits you",
    description:
      "Explore tech skills that fit what you enjoy and do well. A welcoming, beginner-friendly guide for young Nigerians—start with what you have.",
    images: [
      {
        url: "/sabi_logo_pic.png",
        width: 640,
        height: 640,
        alt: "Sabi — find your place in tech",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Sabi | Find a tech skill that fits you",
    description:
      "Find a tech skill that fits your strengths and interests. A beginner-friendly guide for young Nigerians, with English, Pidgin, Yorùbá, and Igbo support.",
    images: [
      {
        url: "/sabi_logo_pic.png",
        alt: "Sabi — find your place in tech",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
