# On Digital · Sistema de Gestão

Sistema interno de gestão para a agência **ON Digital**. Fluxo piloto: cliente → projeto → tarefa → entrega → aprovação, validado com o cliente de homologação **RD3 Moda Fitness**.

Este repositório segue a arquitetura de portabilidade definida na revisão técnica da Fase 0: PostgreSQL com migrations versionadas, camada de serviços isolando qualquer chamada ao Supabase, e nenhuma dependência de recurso proprietário sem registro em ADR.

## Estrutura

```
apps/web            Frontend (React + TypeScript + Vite), com rotas separadas para área interna (/app) e portal do cliente (/portal)
services             Camada de acesso a dados, autenticação, storage, auditoria e notificações. Nenhum componente de apps/web fala direto com o Supabase, sempre passa por aqui
db/migrations        Migrations SQL versionadas
db/policies          Definição das políticas de RLS, versionadas junto das migrations
db/seeds             Dados de teste (organização piloto, cliente fictício)
tests                Unitários, integração (inclui testes de política de RLS por perfil) e E2E
infra/docker         Composição para a produção futura na VPS HostGator
infra/docs           Documentação de infraestrutura, incluindo variáveis de ambiente
docs/decisoes-arquiteturais   Um arquivo por decisão relevante (ADR), especialmente as que afetam portabilidade
```

## Ambientes

* **Teste**: Netlify (frontend) + Supabase Cloud (banco, auth, storage). Ambiente descartável, nunca premissa de arquitetura.
* **Produção (alvo)**: VPS Linux HostGator com Docker, PostgreSQL próprio, storage privado, reverse proxy, worker e backup, sem dependência de plataforma externa.

## Como começar

1. Copie `.env.example` para `.env` e preencha as variáveis (ver `infra/docs/variaveis-de-ambiente.md`).
2. Instale as dependências do frontend em `apps/web`.
3. Aplique as migrations em `db/migrations` no seu projeto Supabase de teste.
4. Rode os testes em `tests` antes de qualquer alteração em produção.

## Regras que não podem ser quebradas

* Nenhuma chamada direta ao Supabase fora de `services`.
* Nenhuma tabela nova sem política de RLS testada.
* Nenhuma versão de entrega aprovada é sobrescrita.
* Nenhum secret no código ou no repositório, apenas em variáveis de ambiente.
* Toda decisão que reduza portabilidade futura é registrada em `docs/decisoes-arquiteturais` antes de ser implementada.

Ver o documento completo da Fase 0 (revisão técnica, matriz de permissões, modelo relacional e backlog) na conversa com o Claude que originou este repositório.
