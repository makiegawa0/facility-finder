import "./globals.css";
import "bootstrap/dist/css/bootstrap.css"; // or include from a CDN
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Facility Nearby",
  description: "Using visgl.github.io/react-google-maps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
