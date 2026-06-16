# CTNC Gestão

Sistema SaaS de gestão para Comunidades Terapêuticas de dependência química.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend web | React 19 + Vite + TypeScript + Tailwind |
| App mobile | React Native + Expo *(planejado — ainda não iniciado)* |
| Backend/BaaS | Supabase (Auth + PostgreSQL + Storage) |
| Shared | `@ctnc/shared` — tipos TypeScript |

## Estrutura

```
ctnc-gestao/
├── apps/
│   ├── web/          # React + Vite (implementado)
│   └── mobile/       # React Native + Expo (planejado — pasta ainda não criada)
├── packages/
│   └── shared/       # Tipos e utilitários compartilhados
└── supabase/
    ├── migrations/   # Schema SQL (001–008)
    └── seed_*.sql    # Seeds de configuração inicial
```

## Setup rápido

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. SQL Editor → New query → execute **na ordem** todas as migrations de `supabase/migrations/`:
   - `001_schema_inicial.sql` → `002_triagens.sql` → `003_fase2_clinico.sql` →
     `004_fase3_operacional.sql` → `005_documentos.sql` → `006_financeiro.sql` →
     `007_categorias_seed.sql` → `008_storage_fotos.sql`
   - A `008` já cria o bucket `acolhidos` (privado) e as políticas de Storage — não é preciso criá-lo manualmente.
3. Crie o primeiro usuário em **Authentication → Users → Add user** e rode `supabase/seed_primeiro_usuario.sql`.

### 2. App web

```bash
cp apps/web/.env.example apps/web/.env.local
# Preencha com os valores do seu projeto Supabase (Project Settings → API):
#   VITE_SUPABASE_URL      → use a URL base do projeto, SEM "/rest/v1/" no final
#                            ex.: https://seuprojeto.supabase.co
#   VITE_SUPABASE_ANON_KEY → chave anon / public

npm install
npm run web
```

O app abre em `http://localhost:5173`

## Funcionalidades (web)

Todas implementadas e em uso:

- [x] Monorepo npm workspaces
- [x] Schema SQL com RLS multi-tenant
- [x] Autenticação (Supabase Auth + perfil Diretor/Coordenador)
- [x] Acolhidos: cadastro completo, foto, contato, responsável
- [x] Listagem com busca e filtro por status + Dashboard com indicadores
- [x] Triagens (instrumentos ASSIST e AUDIT)
- [x] PAS (Plano de Atendimento Singular) + Registros Terapêuticos + Ocorrências
- [x] Visitas e Atividades (com controle de presença)
- [x] Gerador de documentos PDF (6 modelos: termos, autorização de imagem, declarações)
- [x] Financeiro (convênios, lançamentos, categorias)
- [x] Configurações da comunidade
- [x] Layout responsivo mobile-first

### Fotos dos acolhidos (privacidade / LGPD)

As fotos são dados sensíveis. O bucket `acolhidos` é **privado**: o upload guarda apenas o
*path* do arquivo e a exibição usa **URLs assinadas temporárias** (`createSignedUrl`), com
isolamento por tenant via políticas RLS (migration `008`).

## Próximos passos

- **App mobile** (React Native + Expo) — ainda não iniciado. O script `npm run mobile`
  depende de `apps/mobile`, que será criado nessa fase.
