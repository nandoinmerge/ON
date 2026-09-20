-- tests/integration/organizations_rls.test.sql
-- Rodar com: supabase test db
-- Pré-requisito: extensão pgtap habilitada no banco local
-- (o template de projeto do Supabase já vem com ela disponível).

begin;
select plan(6);

-- Duas organizações e dois usuários fictícios, só para este teste.
insert into public.organizations (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Organização A', 'org-a'),
  ('00000000-0000-0000-0000-000000000002', 'Organização B', 'org-b');

-- profiles.id tem FK para auth.users, então criamos os usuários lá primeiro.
insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-000000000001', 'usuaria-a@teste.com'),
  ('10000000-0000-0000-0000-000000000002', 'usuario-b@teste.com')
on conflict (id) do nothing;

insert into public.profiles (id, organization_id, full_name, email, role_default) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Usuária A', 'usuaria-a@teste.com', 'owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Usuário B', 'usuario-b@teste.com', 'owner');

insert into public.organization_members (organization_id, profile_id, role, status) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'owner', 'active');

-- Simula a Usuária A autenticada.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select results_eq(
  $$ select count(*) from public.organizations $$,
  $$ values (1::bigint) $$,
  'Usuária A só enxerga a própria organização'
);

select results_eq(
  $$ select count(*) from public.profiles $$,
  $$ values (1::bigint) $$,
  'Usuária A só enxerga perfis da própria organização'
);

select throws_ok(
  $$ update public.organizations set name = 'Invadido' where id = '00000000-0000-0000-0000-000000000002' $$,
  'Usuária A não consegue atualizar organização de outra organização'
);

-- Troca para o Usuário B.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$ select count(*) from public.organizations $$,
  $$ values (1::bigint) $$,
  'Usuário B só enxerga a própria organização'
);

select is(
  (select name from public.organizations limit 1),
  'Organização B',
  'Usuário B enxerga apenas a Organização B, não a A'
);

select lives_ok(
  $$ update public.organizations set name = 'Organização B renomeada' where id = '00000000-0000-0000-0000-000000000002' $$,
  'Usuário B (owner da própria organização) consegue atualizar a própria organização'
);

select * from finish();
rollback;
