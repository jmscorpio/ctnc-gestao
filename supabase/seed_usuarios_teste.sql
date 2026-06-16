-- ============================================================
-- SEED: Usuários de teste (perfil Diretor)
-- ============================================================
-- Passo 1 (manual): crie cada usuário em Authentication > Users > Add user,
--                   marcando "Auto Confirm User". Anote os e-mails.
-- Passo 2: edite a lista de e-mails abaixo e execute este script.
--
-- O script busca o UUID de cada usuário pelo e-mail e cria o perfil
-- vinculado à comunidade (assume uma única comunidade cadastrada).
-- Reexecutável: atualiza o perfil caso já exista (on conflict).
-- ============================================================

insert into profiles (id, tenant_id, role, nome, email)
select
  u.id,
  (select id from tenants limit 1),
  'diretor',
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email
from auth.users u
where u.email in (
  'testador1@exemplo.com',   -- altere
  'testador2@exemplo.com'    -- altere / adicione quantos quiser
)
on conflict (id) do update
  set role = excluded.role,
      tenant_id = excluded.tenant_id;
