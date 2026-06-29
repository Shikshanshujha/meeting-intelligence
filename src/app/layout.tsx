import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/analytics/posthog-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Meeting Intelligence",
  description: "Smarter sales meetings over time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-white font-sans antialiased text-zinc-900`}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
