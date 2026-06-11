-- ============================================================
-- CTNC Gestão — Schema Inicial (Fase 1 MVP)
-- Aplicar no Supabase: SQL Editor > New query > Cole e Execute
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum (
  'diretor', 'coordenador', 'medico', 'enfermeiro',
  'psicologo', 'assistente_social', 'recepcionista'
);

create type acolhido_status as enum (
  'ativo', 'alta', 'desligado', 'transferido', 'obito'
);

create type sexo_type as enum ('masculino', 'feminino', 'outro');

create type estado_civil_type as enum (
  'solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro'
);

create type escolaridade_type as enum (
  'sem_escolaridade', 'fundamental_incompleto', 'fundamental_completo',
  'medio_incompleto', 'medio_completo',
  'superior_incompleto', 'superior_completo', 'pos_graduacao'
);

-- ============================================================
-- TENANTS
-- ============================================================
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  cnpj        text unique,
  email       text,
  telefone    text,
  endereco    jsonb,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (vinculado ao Supabase Auth)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  role        user_role not null default 'coordenador',
  nome        text not null,
  email       text not null,
  telefone    text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_profiles_tenant on profiles(tenant_id);

-- ============================================================
-- ACOLHIDOS
-- ============================================================
create table acolhidos (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references tenants(id) on delete cascade,
  numero_prontuario    text not null,
  status               acolhido_status not null default 'ativo',
  nome                 text not null,
  nome_social          text,
  data_nascimento      date not null,
  sexo                 sexo_type not null,
  estado_civil         estado_civil_type,
  escolaridade         escolaridade_type,
  profissao            text,
  naturalidade         text,
  nacionalidade        text not null default 'Brasileira',
  cpf                  text,
  rg                   text,
  rg_orgao_emissor     text,
  foto_url             text,
  data_acolhimento     date not null default current_date,
  data_saida           date,
  motivo_saida         text,
  observacoes          text,
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique(tenant_id, numero_prontuario)
);

create index idx_acolhidos_tenant on acolhidos(tenant_id);
create index idx_acolhidos_status on acolhidos(tenant_id, status);
create index idx_acolhidos_nome on acolhidos(tenant_id, nome);

-- Gera número de prontuário automaticamente por tenant
create or replace function gerar_numero_prontuario()
returns trigger as $$
declare
  proximo int;
begin
  select coalesce(max(cast(numero_prontuario as integer)), 0) + 1
    into proximo
    from acolhidos
   where tenant_id = new.tenant_id
     and numero_prontuario ~ '^\d+$';
  new.numero_prontuario := lpad(proximo::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_numero_prontuario
  before insert on acolhidos
  for each row
  when (new.numero_prontuario is null or new.numero_prontuario = '')
  execute function gerar_numero_prontuario();

-- updated_at automático
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_acolhidos_updated_at
  before update on acolhidos
  for each row execute function set_updated_at();

-- ============================================================
-- ACOLHIDOS_CONTATO
-- ============================================================
create table acolhidos_contato (
  id                     uuid primary key default uuid_generate_v4(),
  acolhido_id            uuid not null references acolhidos(id) on delete cascade,
  tenant_id              uuid not null references tenants(id) on delete cascade,
  telefone               text,
  celular                text,
  email                  text,
  endereco_logradouro    text,
  endereco_numero        text,
  endereco_complemento   text,
  endereco_bairro        text,
  endereco_cidade        text,
  endereco_estado        char(2),
  endereco_cep           text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique(acolhido_id)
);

create trigger trg_contato_updated_at
  before update on acolhidos_contato
  for each row execute function set_updated_at();

-- ============================================================
-- RESPONSAVEIS
-- ============================================================
create table responsaveis (
  id           uuid primary key default uuid_generate_v4(),
  acolhido_id  uuid not null references acolhidos(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  nome         text not null,
  parentesco   text not null,
  telefone     text,
  celular      text,
  email        text,
  endereco     jsonb,
  principal    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_responsaveis_acolhido on responsaveis(acolhido_id);

-- ============================================================
-- DOCUMENTOS
-- ============================================================
create table documentos (
  id           uuid primary key default uuid_generate_v4(),
  acolhido_id  uuid not null references acolhidos(id) on delete cascade,
  tenant_id    uuid not null references tenants(id) on delete cascade,
  tipo         text not null,
  numero       text,
  arquivo_url  text,
  observacoes  text,
  created_at   timestamptz not null default now()
);

create index idx_documentos_acolhido on documentos(acolhido_id);

-- ============================================================
-- MEDICAMENTOS
-- ============================================================
create table medicamentos (
  id                  uuid primary key default uuid_generate_v4(),
  acolhido_id         uuid not null references acolhidos(id) on delete cascade,
  tenant_id           uuid not null references tenants(id) on delete cascade,
  nome                text not null,
  dosagem             text,
  frequencia          text,
  via_administracao   text,
  prescrito_por       text,
  inicio              date,
  fim                 date,
  ativo               boolean not null default true,
  observacoes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_medicamentos_acolhido on medicamentos(acolhido_id, ativo);

create trigger trg_medicamentos_updated_at
  before update on medicamentos
  for each row execute function set_updated_at();

-- ============================================================
-- HISTORICO_SAUDE
-- ============================================================
create table historico_saude (
  id                      uuid primary key default uuid_generate_v4(),
  acolhido_id             uuid not null references acolhidos(id) on delete cascade,
  tenant_id               uuid not null references tenants(id) on delete cascade,
  substancias_uso         jsonb,
  tempo_uso               text,
  internacoes_anteriores  integer default 0,
  alergias                text,
  doencas_preexistentes   text,
  medicamentos_anteriores text,
  observacoes             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique(acolhido_id)
);

create trigger trg_historico_updated_at
  before update on historico_saude
  for each row execute function set_updated_at();

-- ============================================================
-- ADVERTENCIAS
-- ============================================================
create table advertencias (
  id               uuid primary key default uuid_generate_v4(),
  acolhido_id      uuid not null references acolhidos(id) on delete cascade,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  tipo             text not null,
  descricao        text not null,
  data_ocorrencia  date not null default current_date,
  registrado_por   uuid references auth.users(id),
  created_at       timestamptz not null default now()
);

create index idx_advertencias_acolhido on advertencias(acolhido_id);

-- ============================================================
-- AUDIT_LOG
-- ============================================================
create table audit_log (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id),
  user_id       uuid not null references auth.users(id),
  acao          text not null,
  tabela        text not null,
  registro_id   uuid,
  dados_antes   jsonb,
  dados_depois  jsonb,
  ip            text,
  created_at    timestamptz not null default now()
);

create index idx_audit_tenant on audit_log(tenant_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table tenants          enable row level security;
alter table profiles         enable row level security;
alter table acolhidos        enable row level security;
alter table acolhidos_contato enable row level security;
alter table responsaveis     enable row level security;
alter table documentos       enable row level security;
alter table medicamentos     enable row level security;
alter table historico_saude  enable row level security;
alter table advertencias     enable row level security;
alter table audit_log        enable row level security;

-- Helper: retorna tenant_id do usuário autenticado
create or replace function auth_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper: retorna role do usuário autenticado
create or replace function auth_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Policies: profiles
create policy "Usuários veem seus próprios dados" on profiles
  for select using (id = auth.uid());

create policy "Diretor/Coordenador veem perfis do tenant" on profiles
  for select using (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('diretor', 'coordenador')
  );

create policy "Diretor gerencia perfis do tenant" on profiles
  for all using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'diretor'
  );

-- Policies: acolhidos
create policy "Acesso acolhidos por tenant" on acolhidos
  for all using (tenant_id = auth_tenant_id());

-- Policies: tabelas dependentes de acolhido
create policy "Acesso contato por tenant" on acolhidos_contato
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso responsaveis por tenant" on responsaveis
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso documentos por tenant" on documentos
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso medicamentos por tenant" on medicamentos
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso historico saude por tenant" on historico_saude
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso advertencias por tenant" on advertencias
  for all using (tenant_id = auth_tenant_id());

create policy "Acesso audit_log por tenant" on audit_log
  for select using (tenant_id = auth_tenant_id());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Execute separadamente no Supabase Dashboard > Storage:
-- 1. Criar bucket "acolhidos" (privado)
-- 2. Criar policy: "Autenticados do tenant acessam próprio bucket"
