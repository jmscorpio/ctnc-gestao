# CTNC Gestão

Sistema SaaS de gestão para Comunidades Terapêuticas de dependência química.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend web | React 19 + Vite + TypeScript + Tailwind |
| App mobile | React Native + Expo *(fase 2)* |
| Backend/BaaS | Supabase (Auth + PostgreSQL + Storage) |
| Shared | `@ctnc/shared` — tipos TypeScript |

## Estrutura

```
ctnc-gestao/
├── apps/
│   ├── web/          # React + Vite
│   └── mobile/       # React Native + Expo (em breve)
├── packages/
│   └── shared/       # Tipos e utilitários compartilhados
└── supabase/
    ├── migrations/   # Schema SQL
    └── seed_*.sql    # Seeds de configuração inicial
```

## Setup rápido

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. SQL Editor → New query → cole e execute `supabase/migrations/001_schema_inicial.sql`
3. Crie o bucket `acolhidos` em Storage (privado)
4. Execute `supabase/seed_primeiro_usuario.sql` após criar o usuário em Authentication

### 2. App web

```bash
cp apps/web/.env.example apps/web/.env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com os valores do seu projeto

npm install
npm run web
```

O app abre em `http://localhost:5173`

## Fase 1 — MVP (implementado)

- [x] Monorepo npm workspaces
- [x] Schema SQL com RLS multi-tenant
- [x] Autenticação (Supabase Auth + perfil Diretor/Coordenador)
- [x] Módulo Acolhidos: cadastro completo, foto, contato, responsável
- [x] Listagem com busca e filtro por status
- [x] Dashboard com indicadores
- [x] Layout responsivo mobile-first

## Fases futuras

- **Fase 2:** PAS + Registros Terapêuticos
- **Fase 3:** Visitas e Atividades
- **Fase 4:** Gerador de documentos PDF
- **Fase 5:** Dashboard avançado + Financeiro
- **Fase 6:** Novos perfis (médico, psicólogo, etc.)
