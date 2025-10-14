import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Obra Manager - Habitación Nuestra",
  description: "Sistema de gestión de obra - Control de gastos y avances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
