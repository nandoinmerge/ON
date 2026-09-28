-- 0013_add_profile_avatar.sql
-- Adiciona campo de foto de perfil, para a tela de Meu Perfil.

alter table public.profiles add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Caminho do arquivo de foto de perfil no storage (bucket agencia-arquivos-privados, pasta avatars).';
