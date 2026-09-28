-- 0014_invitations_created_by_default.sql
-- Corrige bug: created_by é NOT NULL e o front não enviava o valor, então
-- todo convite falhava. Agora é preenchido automaticamente com o usuário
-- logado (auth.uid()), sem depender do cliente e sem poder ser falsificado.

alter table public.invitations alter column created_by set default auth.uid();
