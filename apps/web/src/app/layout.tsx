import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const archivo = Archivo({ weight: ["400", "600", "800"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Rowlê",
  description: "Descubra rolês no Distrito Federal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
