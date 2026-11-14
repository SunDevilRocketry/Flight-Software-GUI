import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Liquids Dashboard",
  description: "SDR's liquid engine monitoring dashboard"
};

interface LiquidsLayoutProps {
  children: ReactNode;
}

export default function LiquidsLayout({ children }: LiquidsLayoutProps) {
  return children;
}