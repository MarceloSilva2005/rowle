import { TERMS_OF_USE } from "@rowle/core";
import type { Metadata } from "next";
import { DocumentoLegal } from "../documento-legal";

export const metadata: Metadata = {
  title: "Termos de uso · Rowlê",
  description: "Regras de uso do Rowlê e de divulgação de eventos.",
};

export default function TermosPage() {
  return <DocumentoLegal doc={TERMS_OF_USE} />;
}
