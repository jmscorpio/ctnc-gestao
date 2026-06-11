-- ============================================================
-- CTNC Gestão — Migration 005: Documentos Gerados
-- ============================================================

create type documento_tipo as enum (
  'termo_acolhimento',
  'termo_adesao',
  'contrato_permanencia',
  'declaracao_desligamento',
  'declaracao_conclusao',
  'certificado_conclusao',
  'termo_senapred',
  'autorizacao_imagem',
  'triagem_pertences',
  'normas_visita',
  'outro'
);

create table documentos_gerados (
  id            uuid primary key default uuid_generate_v4(),
  acolhido_id   uuid not null references acolhidos(id) on delete cascade,
  tenant_id     uuid not null references tenants(id) on delete cascade,
  tipo          documento_tipo not null,
  titulo        text not null,
  gerado_por    uuid references auth.users(id),
  gerado_em     timestamptz not null default now(),
  observacoes   text
);

create index idx_docs_acolhido on documentos_gerados(acolhido_id, gerado_em desc);

alter table documentos_gerados enable row level security;

create policy "Acesso documentos_gerados por tenant" on documentos_gerados
  for all using (tenant_id = auth_tenant_id());
