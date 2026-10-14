import { logoSvg, mascotSvg } from "@rowle/design";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function Home() {
  return (
    <main style={{ padding: "48px 16px", maxWidth: 640, margin: "0 auto", display: "grid", gap: 20, justifyItems: "center", textAlign: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design */}
      <img src={asImage(logoSvg)} alt="Rowlê" width={280} height={89} />
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design */}
      <img src={asImage(mascotSvg.acenando)} alt="Toupeira do Rowlê acenando" width={180} height={180} />
      <p style={{ fontWeight: 800, fontSize: 20 }}>Descubra rolês no DF.</p>
      <p style={{ color: "var(--text-muted)" }}>Em desenvolvimento.</p>
    </main>
  );
}
