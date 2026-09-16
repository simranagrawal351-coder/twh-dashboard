import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TWH Workspace · Plutonik",
  description: "Private strategy, content and delivery workspace for Plutonik’s TWH account.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
