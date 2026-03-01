import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEVA",
  description: "NEVA Social Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#0a0a0f] text-white">
        {children}
      </body>
    </html>
  );
}