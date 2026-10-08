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
  title: "SabiPath | Find your place in tech",
  description:
    "Not sure which tech skill is right for you? SabiPath helps young Nigerians match their strengths and interests to a tech path that fits—starting with what they have.",
  openGraph: {
    type: "website",
    url: "https://sabi-psi.vercel.app",
    siteName: "SabiPath",
    locale: "en_NG",
    title: "SabiPath | Find your place in tech",
    description:
      "Find a tech skill that fits your strengths, interests, and starting point. A welcoming guide for young Nigerians exploring tech.",
    images: [
      {
        url: "/sabipath-logo.png",
        width: 1220,
        height: 1130,
        alt: "SabiPath — find your place in tech",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SabiPath | Find your place in tech",
    description:
      "Find a tech skill that fits your strengths, interests, and starting point. Made for young Nigerians exploring tech.",
    images: [
      {
        url: "/sabipath-logo.png",
        alt: "SabiPath — find your place in tech",
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
