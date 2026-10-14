import type { Metadata } from "next";
import "./painel.css";

export const metadata: Metadata = {
  title: "Painel · Rowlê",
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return <div className="painel">{children}</div>;
}
