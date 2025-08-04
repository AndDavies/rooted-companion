import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const josefinSans = localFont({
  src: [
    {
      path: "../public/fonts/Josefin_Sans/JosefinSans-VariableFont_wght.ttf",
      weight: "100 700",
      style: "normal",
    },
    {
      path: "../public/fonts/Josefin_Sans/JosefinSans-Italic-VariableFont_wght.ttf",
      weight: "100 700",
      style: "italic",
    },
  ],
  variable: "--font-josefin-sans",
  display: "swap",
});

const cinzel = localFont({
  src: "../public/fonts/Cinzel/Cinzel-VariableFont_wght.ttf",
  variable: "--font-cinzel",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROOTED Way Companion",
  description: "A digital recovery companion blending wearable insights, breathwork, and personalized coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${josefinSans.variable} ${cinzel.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
