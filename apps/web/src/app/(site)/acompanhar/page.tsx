import { mascotSvg } from "@rowle/design";
import type { Metadata } from "next";
import { Acompanhar } from "./form";

export const metadata: Metadata = {
  title: "Acompanhar sugestão · Rowlê",
  robots: { index: false, follow: false },
};

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function AcompanharPage() {
  return (
    <>
      <section className="hero hero-grande" aria-labelledby="titulo-acompanhar">
        <div>
          <h1 id="titulo-acompanhar">Acompanhar sugestão</h1>
          <p>Informe o protocolo e o código recebidos no envio.</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design */}
        <img src={asImage(mascotSvg.procurando)} alt="" width={150} height={150} />
      </section>
      <Acompanhar />
    </>
  );
}
