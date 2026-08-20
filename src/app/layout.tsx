// /app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Flight Dashboard",
  description: "SDR's flight monitoring dashboard",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
