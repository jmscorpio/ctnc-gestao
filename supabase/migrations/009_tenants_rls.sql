-- ============================================================
-- 009 — Políticas RLS faltantes na tabela tenants
-- A tabela tenants tinha RLS habilitado (migration 001) mas NENHUMA
-- política, o que bloqueava toda leitura pelo cliente. Isso quebrava a
-- aba Documentos (única que lê tenants direto para montar o PDF).
-- ============================================================

-- Qualquer usuário autenticado pode ler o tenant ao qual pertence
drop policy if exists "Usuários veem seu próprio tenant" on tenants;
create policy "Usuários veem seu próprio tenant" on tenants
  for select using (id = auth_tenant_id());

-- Apenas o Diretor pode editar os dados da própria comunidade
drop policy if exists "Diretor edita o próprio tenant" on tenants;
create policy "Diretor edita o próprio tenant" on tenants
  for update using (id = auth_tenant_id() and auth_user_role() = 'diretor');
