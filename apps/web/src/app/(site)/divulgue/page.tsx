import { mascotSvg } from "@rowle/design";
import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SugestaoForm } from "./form";

export const metadata: Metadata = {
  title: "Divulgue seu rolê · Rowlê",
  description: "Mande um evento do DF para a curadoria do Rowlê.",
};

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function DivulguePage() {
  return (
    <>
      <section className="hero hero-grande" aria-labelledby="titulo-divulgue">
        <div>
          <h1 id="titulo-divulgue">Divulgue seu rolê</h1>
          <p>O envio é gratuito. A curadoria analisa cada evento antes de publicar no app.</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design */}
        <img src={asImage(mascotSvg.acenando)} alt="" width={150} height={150} />
      </section>
      <Suspense fallback={<p className="muted">Carregando…</p>}>
        <FormComCategorias />
      </Suspense>
    </>
  );
}

async function FormComCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name").order("sort_order");
  return <SugestaoForm categories={data ?? []} />;
}
