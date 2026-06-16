-- ============================================================
-- 008 — Storage de fotos dos acolhidos (bucket PRIVADO + RLS)
-- As fotos são dados sensíveis (LGPD): o bucket fica privado e o
-- app exibe via URL assinada temporária (createSignedUrl).
-- O path dos arquivos é: <tenant_id>/fotos/<arquivo>
-- ============================================================

-- 1. Cria/garante o bucket 'acolhidos' como PRIVADO
insert into storage.buckets (id, name, public)
values ('acolhidos', 'acolhidos', false)
on conflict (id) do update set public = false;

-- 2. Políticas de acesso — cada usuário só enxerga/manipula os
--    arquivos cuja primeira pasta é o tenant_id do seu perfil.
drop policy if exists "fotos: leitura por tenant" on storage.objects;
drop policy if exists "fotos: upload por tenant"  on storage.objects;
drop policy if exists "fotos: update por tenant"  on storage.objects;
drop policy if exists "fotos: delete por tenant"  on storage.objects;

create policy "fotos: leitura por tenant"
on storage.objects for select to authenticated
using (
  bucket_id = 'acolhidos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
);

create policy "fotos: upload por tenant"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'acolhidos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
);

create policy "fotos: update por tenant"
on storage.objects for update to authenticated
using (
  bucket_id = 'acolhidos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
);

create policy "fotos: delete por tenant"
on storage.objects for delete to authenticated
using (
  bucket_id = 'acolhidos'
  and (storage.foldername(name))[1] = (select tenant_id::text from public.profiles where id = auth.uid())
);
