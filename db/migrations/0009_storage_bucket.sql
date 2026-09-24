-- 0009_storage_bucket.sql
-- Bucket privado para anexos (entregas, contratos, briefings, projetos, tarefas).
-- Cada arquivo fica em: {organization_id}/{entity_type}/{entity_id}/{arquivo}
-- RLS: só membro ativo da organização dona do arquivo pode ler/enviar/apagar.

insert into storage.buckets (id, name, public, file_size_limit)
values ('agencia-arquivos-privados', 'agencia-arquivos-privados', false, 52428800)
on conflict (id) do nothing;

create policy "Membros leem arquivos da própria organização"
on storage.objects for select
to authenticated
using (
  bucket_id = 'agencia-arquivos-privados'
  and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
);

create policy "Membros enviam arquivos para a própria organização"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agencia-arquivos-privados'
  and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
);

create policy "Membros apagam arquivos da própria organização"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agencia-arquivos-privados'
  and (storage.foldername(name))[1]::uuid in (select public.current_organization_ids())
);
