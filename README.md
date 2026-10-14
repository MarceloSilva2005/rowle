# Rowlê

Aplicativo Android para descobrir rolês no Distrito Federal: shows, festas, cultura, games, gastronomia e encontros, com data, local e preço claros, e o caminho direto para a bilheteria oficial ou para a rota.

> Em desenvolvimento. Ainda não há versão publicada.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `apps/mobile` | App Android (Expo + React Native) |
| `apps/web` | Painel de operação e páginas públicas (Next.js) |
| `packages/core` | Regras de negócio compartilhadas: preço, datas e estados do evento |
| `supabase` | Banco de dados, migrações e políticas de acesso |

## Rodando localmente

Pré-requisitos: Node 24, Docker (para o banco local) e, para o app, Android SDK com JDK 17.

```bash
npm install
npm run db:start      # Supabase local
npm run dev -w @rowle/web
npm run android -w @rowle/mobile
```

Checagens:

```bash
npm run lint
npm run typecheck
npm test
npm run test:db       # testes do banco (requer Docker)
```
