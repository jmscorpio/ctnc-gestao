-- ============================================================
-- CTNC Gestão — Migration 003: Fase 2 Clínico
-- PAS, Registros Terapêuticos, Intercorrências
-- ============================================================

-- ============================================================
-- ENUMS FASE 2
-- ============================================================
create type pas_status as enum ('ativo', 'concluido', 'cancelado');
create type pas_acao_status as enum ('pendente', 'em_andamento', 'concluida', 'cancelada');
create type fase_tratamento as enum (
  'acolhimento', 'estabilizacao', 'desintoxicacao',
  'reabilitacao', 'reinsercao_social'
);
create type registro_tipo as enum (
  'evolucao_clinica', 'atendimento_individual',
  'atendimento_grupo', 'demanda', 'outro'
);
create type area_profissional as enum (
  'medico', 'enfermagem', 'psicologia', 'assistencia_social',
  'terapia_ocupacional', 'educacao_fisica', 'outros'
);
create type intercorrencia_tipo as enum (
  'saude', 'comportamental', 'fuga', 'agressao', 'acidente', 'outro'
);
create type intercorrencia_gravidade as enum ('leve', 'moderada', 'grave');

-- ============================================================
-- PAS — Plano de Atendimento Singular
-- ============================================================
create table pas (
  id               uuid primary key default uuid_generate_v4(),
  acolhido_id      uuid not null references acolhidos(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  fase             fase_tratamento not null default 'acolhimento',
  status           pas_status not null default 'ativo',
  data_inicio      date not null default current_date,
  data_revisao     date,
  data_conclusao   date,
  objetivo_geral   text,
  observacoes      text,
  elaborado_por    uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_pas_acolhido on pas(acolhido_id, status);

create trigger trg_pas_updated_at
  before update on pas
  for each row execute function set_updated_at();

-- ============================================================
-- PAS_ACOES — Ações do PAS
-- ============================================================
create table pas_acoes (
  id             uuid primary key default uuid_generate_v4(),
  pas_id         uuid not null references pas(id) on delete cascade,
  tenant_id      uuid not null references tenants(id) on delete cascade,
  area           area_profissional not null,
  objetivo       text not null,
  meta           text,
  intervencao    text,
  responsavel    text,
  prazo          date,
  status         pas_acao_status not null default 'pendente',
  resultado      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_pas_acoes_pas on pas_acoes(pas_id);

create trigger trg_pas_acoes_updated_at
  before update on pas_acoes
  for each row execute function set_updated_at();

-- ============================================================
-- REGISTROS_TERAPEUTICOS
-- ============================================================
create table registros_terapeuticos (
  id                uuid primary key default uuid_generate_v4(),
  acolhido_id       uuid not null references acolhidos(id) on delete cascade,
  tenant_id         uuid not null references tenants(id) on delete cascade,
  tipo              registro_tipo not null,
  area              area_profissional not null,
  data_registro     date not null default current_date,
  profissional_nome text,
  conteudo          text not null,
  participantes     integer,
  atividade_nome    text,
  created_by        uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_registros_acolhido on registros_terapeuticos(acolhido_id, data_registro desc);
create index idx_registros_tipo on registros_terapeuticos(tenant_id, tipo);

create trigger trg_registros_updated_at
  before update on registros_terapeuticos
  for each row execute function set_updated_at();

-- ============================================================
-- INTERCORRENCIAS
-- ============================================================
create table intercorrencias (
  id               uuid primary key default uuid_generate_v4(),
  acolhido_id      uuid not null references acolhidos(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  tipo             intercorrencia_tipo not null,
  gravidade        intercorrencia_gravidade not null default 'leve',
  data_ocorrencia  date not null default current_date,
  hora_ocorrencia  time,
  descricao        text not null,
  medidas_tomadas  text,
  encaminhamento   text,
  registrado_por   uuid references auth.users(id),
  created_at       timestamptz not null default now()
);

create index idx_intercorrencias_acolhido on intercorrencias(acolhido_id, data_ocorrencia desc);

-- ============================================================
-- RLS
-- ============================================================
alter table pas                    enable row level security;
alter table pas_acoes              enable row level security;
alter table registros_terapeuticos enable row level security;
alter table intercorrencias        enable row level security;

create policy "Acesso pas por tenant" on pas
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso pas_acoes por tenant" on pas_acoes
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso registros por tenant" on registros_terapeuticos
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso intercorrencias por tenant" on intercorrencias
  for all using (tenant_id = auth_tenant_id());
