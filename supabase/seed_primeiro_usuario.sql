-- ============================================================
-- SEED: Criar primeiro tenant + perfil Diretor
-- Execute APÓS aplicar a migration 001.
-- Substitua os valores antes de executar.
-- ============================================================

-- 1. Crie o usuário no Supabase Auth Dashboard (Authentication > Users > Add user)
--    ou via: supabase.auth.admin.createUser({ email, password })
--    Anote o UUID gerado — use abaixo em INSERT INTO profiles.

-- 2. Crie o tenant
insert into tenants (nome, cnpj, email)
values (
  'Nome da Comunidade Terapêutica',  -- altere
  '00.000.000/0001-00',              -- altere (ou null)
  'contato@suact.com.br'             -- altere
)
returning id;  -- copie este UUID para o próximo passo

-- 3. Insira o perfil do Diretor
-- Substitua: <USER_UUID> pelo UUID do Supabase Auth
--            <TENANT_UUID> pelo UUID retornado acima
insert into profiles (id, tenant_id, role, nome, email)
values (
  '<USER_UUID>',
  '<TENANT_UUID>',
  'diretor',
  'Nome do Diretor',
  'diretor@suact.com.br'
);
