-- ============================================================
-- CTNC Gestão — Migration 004: Fase 3 Operacional
-- Visitas, Atividades, Agenda, Presenças
-- ============================================================

-- ============================================================
-- ENUMS FASE 3
-- ============================================================
create type visita_tipo as enum ('familiar', 'ressocializacao', 'institucional', 'outro');
create type visita_status as enum ('agendada', 'realizada', 'cancelada', 'nao_compareceu');
create type atividade_tipo as enum (
  'terapeutica', 'educativa', 'laboral', 'religiosa', 'recreativa',
  'esportiva', 'cultural', 'outro'
);
create type presenca_status as enum ('presente', 'ausente', 'justificado');

-- ============================================================
-- VISITAS
-- ============================================================
create table visitas (
  id               uuid primary key default uuid_generate_v4(),
  acolhido_id      uuid not null references acolhidos(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  tipo             visita_tipo not null default 'familiar',
  status           visita_status not null default 'agendada',
  visitante_nome   text not null,
  vinculo          text,
  data_visita      date not null,
  hora_prevista    time,
  hora_entrada     time,
  hora_saida       time,
  local_visita     text,
  autorizado_por   uuid references auth.users(id),
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_visitas_acolhido on visitas(acolhido_id, data_visita desc);
create index idx_visitas_tenant_data on visitas(tenant_id, data_visita desc);

create trigger trg_visitas_updated_at
  before update on visitas
  for each row execute function set_updated_at();

-- ============================================================
-- ATIVIDADES (catálogo/template)
-- ============================================================
create table atividades (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  nome             text not null,
  descricao        text,
  tipo             atividade_tipo not null default 'terapeutica',
  area             area_profissional,
  responsavel_nome text,
  duracao_min      integer,
  ativa            boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_atividades_tenant on atividades(tenant_id, ativa);

create trigger trg_atividades_updated_at
  before update on atividades
  for each row execute function set_updated_at();

-- ============================================================
-- AGENDA_ATIVIDADES (ocorrências agendadas)
-- ============================================================
create table agenda_atividades (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  atividade_id     uuid references atividades(id) on delete set null,
  titulo           text not null,
  data_atividade   date not null,
  hora_inicio      time,
  hora_fim         time,
  local            text,
  responsavel_nome text,
  observacoes      text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now()
);

create index idx_agenda_tenant_data on agenda_atividades(tenant_id, data_atividade desc);

-- ============================================================
-- PRESENCAS
-- ============================================================
create table presencas (
  id               uuid primary key default uuid_generate_v4(),
  agenda_id        uuid not null references agenda_atividades(id) on delete cascade,
  acolhido_id      uuid not null references acolhidos(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  status           presenca_status not null default 'presente',
  justificativa    text,
  created_at       timestamptz not null default now(),
  unique(agenda_id, acolhido_id)
);

create index idx_presencas_agenda on presencas(agenda_id);
create index idx_presencas_acolhido on presencas(acolhido_id);

-- ============================================================
-- RLS
-- ============================================================
alter table visitas           enable row level security;
alter table atividades        enable row level security;
alter table agenda_atividades enable row level security;
alter table presencas         enable row level security;

create policy "Acesso visitas por tenant" on visitas
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso atividades por tenant" on atividades
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso agenda por tenant" on agenda_atividades
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso presencas por tenant" on presencas
  for all using (tenant_id = auth_tenant_id());
