# Banco de dados

## Ordem de aplicação

As migrations em `db/migrations` são aplicadas em ordem numérica. Cada arquivo de política em `db/policies` corresponde à migration de mesmo número e deve rodar logo depois dela.

Organização piloto: **ON Digital** (`slug: on-digital`).
Primeiro cliente de homologação (a partir da Fase 2, quando a tabela `clients` existir): **RD3 Moda Fitness**.

## Como aplicar localmente (Supabase CLI)

```bash
supabase start
cat db/migrations/*.sql db/policies/*.sql | supabase db execute
```

Ou, aplicando arquivo por arquivo na ordem certa, o que é mais fácil de acompanhar durante o desenvolvimento:

```bash
for f in db/migrations/000{1,2,3,4}*.sql db/policies/000{1,2,3}*.sql; do
  echo "Aplicando $f"
  psql "$DATABASE_URL" -f "$f"
done
```

Ao integrar com o fluxo padrão do Supabase CLI (`supabase db push` contra o projeto de teste), copie estes arquivos para `supabase/migrations/` com prefixo de timestamp, na mesma ordem relativa. Mantemos a numeração aqui, em `db/`, como a fonte de verdade portátil (funciona em qualquer PostgreSQL, não só no fluxo do Supabase).

## Como criar a organização piloto

Não existe seed SQL direto para `organizations`, porque toda organização precisa nascer com um proprietário (ver `db/migrations/0004_helper_functions.sql`). O primeiro usuário (Proprietário da ON Digital) deve:

1. Se cadastrar normalmente pelo Supabase Auth (e-mail e senha).
2. Chamar `select public.create_organization_with_owner('ON Digital', 'on-digital', '<nome completo>', '<email>');` autenticado como esse usuário.

Isso cria a organização, o profile e o vínculo de owner em uma única transação.

## Como rodar os testes de RLS

```bash
supabase test db
```

Isso executa todo arquivo em `tests/integration/*.test.sql` usando pgTAP. O teste atual (`organizations_rls.test.sql`) cobre:

* Um usuário só enxerga organizações e perfis da própria organização.
* Um usuário não consegue atualizar dado de outra organização, mesmo tentando pelo id direto.
* Um owner consegue atualizar a própria organização normalmente.

## Risco em aberto

Este teste roda contra um Postgres local do Supabase CLI. Ele ainda não foi executado contra o projeto real de homologação, porque este ambiente de desenvolvimento não tem acesso de rede ao Supabase Cloud. Antes de considerar esta entrega definitivamente validada, rode `supabase test db` no seu ambiente local ou no projeto de homologação e confirme que os 6 casos passam.
