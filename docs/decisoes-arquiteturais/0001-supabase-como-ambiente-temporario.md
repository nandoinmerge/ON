# ADR 0001: Supabase Cloud e Netlify como ambiente temporário de teste

## Status
Aceita.

## Contexto
O sistema precisa rodar em produção, de forma definitiva, em uma VPS Linux da HostGator com Docker e acesso root, sem depender de Netlify, Supabase Cloud ou qualquer outra plataforma externa. No entanto, testar e validar o produto exige um ambiente rápido de configurar, o que Netlify e Supabase Cloud oferecem.

## Decisão
Usar Netlify e Supabase Cloud apenas como ambiente de teste, tratando-os como descartáveis. Toda decisão de arquitetura é tomada considerando a migração futura para uma VPS própria, e não o contrário.

Para isso:

* Todo acesso a banco, autenticação e arquivos passa pela camada `services/`, nunca é chamado diretamente pelo frontend.
* Migrations são SQL versionado no repositório, nunca alteração manual pelo console do Supabase.
* Nenhum recurso proprietário do Supabase é usado sem essa decisão ser registrada em uma ADR própria (por exemplo, Edge Functions, Realtime, ou qualquer recurso sem equivalente direto em PostgreSQL puro).

## Consequências

* Ganho de velocidade na fase de testes, sem comprometer a meta de portabilidade.
* Ao migrar, autenticação, e-mails transacionais, políticas e segredos precisam ser revalidados um a um (ver `infra/docs/variaveis-de-ambiente.md`).
* A hospedagem HostGator escolhida precisa obrigatoriamente ter acesso root e suportar Docker; hospedagem compartilhada não atende a este requisito.
