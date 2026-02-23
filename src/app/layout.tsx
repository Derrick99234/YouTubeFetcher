import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTubeFetcher",
  description: "Fetch all videos from any YouTube channel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
