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
  title: "Sabi | Find your place in tech",
  description:
    "Not sure which tech skill is right for you? Sabi helps young Nigerians match their strengths and interests to a tech path that fits—starting with what they have.",
  openGraph: {
    type: "website",
    url: "https://sabi-psi.vercel.app",
    siteName: "Sabi",
    locale: "en_NG",
    title: "Sabi | Find your place in tech",
    description:
      "Find a tech skill that fits your strengths, interests, and starting point. A welcoming guide for young Nigerians exploring tech.",
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
    title: "Sabi | Find your place in tech",
    description:
      "Find a tech skill that fits your strengths, interests, and starting point. Made for young Nigerians exploring tech.",
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
