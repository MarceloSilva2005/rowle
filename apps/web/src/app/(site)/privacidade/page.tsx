import { PRIVACY_POLICY } from "@rowle/core";
import type { Metadata } from "next";
import { DocumentoLegal } from "../documento-legal";

export const metadata: Metadata = {
  title: "Política de privacidade · Rowlê",
  description: "Quais dados o Rowlê trata, por quanto tempo e como pedir acesso ou exclusão.",
};

export default function PrivacidadePage() {
  return <DocumentoLegal doc={PRIVACY_POLICY} />;
}
