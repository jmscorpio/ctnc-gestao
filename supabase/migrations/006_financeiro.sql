-- ============================================================
-- CTNC Gestão — Migration 006: Módulo Financeiro
-- Convênios, Categorias, Lançamentos
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
create type financeiro_tipo as enum ('receita', 'despesa');

create type convenio_tipo as enum (
  'municipal', 'estadual', 'federal',
  'privado', 'religioso', 'filantropia', 'outro'
);

-- ============================================================
-- CONVÊNIOS
-- ============================================================
create table convenios (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  nome              text not null,
  tipo              convenio_tipo not null default 'outro',
  orgao_responsavel text,
  numero_processo   text,
  valor_mensal      numeric(12, 2) not null default 0,
  data_inicio       date not null,
  data_fim          date,
  ativo             boolean not null default true,
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_convenios_tenant on convenios(tenant_id, ativo);

create trigger trg_convenios_updated_at
  before update on convenios
  for each row execute function set_updated_at();

-- ============================================================
-- CATEGORIAS FINANCEIRAS
-- ============================================================
create table categorias_financeiras (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  tipo        financeiro_tipo not null,
  nome        text not null,
  cor         text not null default '#6b7280',
  ativa       boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_categorias_tenant on categorias_financeiras(tenant_id, tipo, ativa);

-- Categorias padrão são inseridas via seed — não via migration

-- ============================================================
-- LANÇAMENTOS FINANCEIROS
-- ============================================================
create table lancamentos_financeiros (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  tipo             financeiro_tipo not null,
  categoria_id     uuid references categorias_financeiras(id) on delete set null,
  convenio_id      uuid references convenios(id) on delete set null,
  data             date not null default current_date,
  valor            numeric(12, 2) not null,
  descricao        text not null,
  comprovante_url  text,
  registrado_por   uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_lancamentos_tenant_data on lancamentos_financeiros(tenant_id, data desc);
create index idx_lancamentos_tipo on lancamentos_financeiros(tenant_id, tipo, data desc);

create trigger trg_lancamentos_updated_at
  before update on lancamentos_financeiros
  for each row execute function set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table convenios               enable row level security;
alter table categorias_financeiras  enable row level security;
alter table lancamentos_financeiros enable row level security;

create policy "Acesso convenios por tenant" on convenios
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso categorias por tenant" on categorias_financeiras
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso lancamentos por tenant" on lancamentos_financeiros
  for all using (tenant_id = auth_tenant_id());
