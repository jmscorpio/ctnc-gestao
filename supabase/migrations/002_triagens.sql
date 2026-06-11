-- ============================================================
-- CTNC Gestão — Migration 002: Triagens (ASSIST e AUDIT)
-- ============================================================

create type triagem_tipo as enum ('assist', 'audit');

create type risco_nivel as enum ('baixo', 'moderado', 'alto', 'muito_alto');

-- Tabela principal de triagens
create table triagens (
  id              uuid primary key default uuid_generate_v4(),
  acolhido_id     uuid not null references acolhidos(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  tipo            triagem_tipo not null,
  realizada_por   uuid references auth.users(id),
  realizada_em    date not null default current_date,
  score_total     integer,
  nivel_risco     risco_nivel,
  observacoes     text,
  created_at      timestamptz not null default now()
);

create index idx_triagens_acolhido on triagens(acolhido_id, tipo, realizada_em desc);

-- Respostas individuais de cada triagem
create table triagem_respostas (
  id           uuid primary key default uuid_generate_v4(),
  triagem_id   uuid not null references triagens(id) on delete cascade,
  questao_id   text not null,   -- ex: "q1_tabaco", "audit_q3"
  resposta     integer not null, -- valor numérico da opção selecionada
  created_at   timestamptz not null default now()
);

create index idx_triagem_respostas on triagem_respostas(triagem_id);

-- Scores por substância para o ASSIST
create table assist_scores_substancia (
  id           uuid primary key default uuid_generate_v4(),
  triagem_id   uuid not null references triagens(id) on delete cascade,
  substancia   text not null,
  score        integer not null,
  nivel_risco  risco_nivel not null,
  created_at   timestamptz not null default now()
);

create index idx_assist_scores on assist_scores_substancia(triagem_id);

-- RLS
alter table triagens                    enable row level security;
alter table triagem_respostas           enable row level security;
alter table assist_scores_substancia    enable row level security;

create policy "Acesso triagens por tenant" on triagens
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso respostas por tenant" on triagem_respostas
  for all using (
    triagem_id in (select id from triagens where tenant_id = auth_tenant_id())
  );

create policy "Acesso assist scores por tenant" on assist_scores_substancia
  for all using (
    triagem_id in (select id from triagens where tenant_id = auth_tenant_id())
  );
