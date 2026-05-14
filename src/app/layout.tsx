import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const headlineFont = Manrope({
  variable: "--font-headline",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KIA VELOCITY PULSE | Premium Automotive Service",
  description: "Guest and mobile appointment platform for Kia maintenance in Tunisia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headlineFont.variable} h-full antialiased dark`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-on-surface">{children}</body>
    </html>
  );
}
