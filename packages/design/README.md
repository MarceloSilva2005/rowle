# @rowle/design

Marca do Rowlê: cores, tipografia, logo, toupeira e capas. Vale para o app Android, o site
e o painel da curadoria. O app é a referência; site e painel seguem as mesmas regras.

## Regras de interface

| Elemento | Regra |
| --- | --- |
| Fundo | Escuro (`bg`), cartões em `surface` com borda `border` e raio 14. Lima é ênfase, nunca fundo grande. |
| Título de tela | Anton em caixa alta, direto no fundo, sem cartão e sem sombra. Toupeira pequena (cerca de 64) à esquerda quando a tela tem uma; ações à direita. |
| Título de seção | Anton em caixa alta, 22. Sem numeração. |
| Rótulo de campo | Archivo 800, 12, caixa alta, espaçamento 1,2, cor `textMuted`. |
| Campo | Borda de 1,5 em `border`, raio 10, texto 15 a 16. |
| Botão | Pílula. Principal: lima com texto em tinta. Secundário: `surfaceRaised`. Perigo: contorno `danger`. Altura mínima 48. |
| Abas e filtros | Pílula com contorno; a ativa é branca (`text`) com texto em tinta. |
| Etiqueta e selo | Pílula, Archivo 800, 11 a 12, caixa alta, espaçamento 0,8. |
| Fita | Faixa lima girada de 3 a 4 graus, texto em Bungee. Só para destaque de data ou de área (carregando, "Curadoria"). |
| Logo e sombra 3D | Só o logo e os ícones ligados usam a sombra deslocada. |
| Classificação indicativa | Só o número (L, 6 … 18), cores oficiais do guia ClassInd. |

Fontes: Anton (títulos), Archivo (texto), Bungee (fitas e marca). No site e no painel elas
entram por `next/font` (`--font-display`, `--font-body`, `--font-brand`); a base de estilos
fica em `apps/web/src/app/painel/painel.css`.
