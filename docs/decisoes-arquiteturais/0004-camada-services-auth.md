# ADR 0004: Camada services/auth centraliza toda autenticação

## Status
Implementada.

## Contexto
A autenticação é um ponto crítico de segurança e portabilidade. Se espalhamos chamadas ao Supabase Auth por toda a aplicação frontend, fica impossível migrar depois (quando sairmos do Supabase Cloud para um VPS próprio) ou adicionar hooks de auditoria.

## Decisão
`services/auth/index.ts` é o **único** lugar onde a aplicação fala com Supabase Auth. Nenhum componente React, nenhuma outra função de negócio chama `supabase.auth` direto.

Funções exportadas:
- `signup(email, password, fullName)`: cria usuário, aguarda confirmação de e-mail
- `login(email, password)`: autentica, retorna sessão
- `logout()`: encerra sessão
- `recoverPassword(email)`: envia link de reset
- `resetPassword(password, token)`: muda senha com token válido
- `getCurrentUser()`: retorna usuário autenticado ou null
- `getSession()`: retorna sessão ativa ou null

Validação: todos os inputs são validados com `zod` antes de qualquer chamada ao banco.

## Convites de membros (services/auth/invite.ts)

Operações administrativas passam por `supabaseAdmin` (service role key), que ignora RLS. Isso é seguro porque:

1. Essas operações só são chamadas de funções que já validaram permissão (owner/admin via `has_role_in_org`).
2. A própria função `acceptInvite` é pública (não requer autenticação), porque um novo membro pode não ter conta ainda.

Fluxo de convite:
1. Admin chama `inviteMember(email, organizationId, role)` → cria linha em `invitations` com token único e expiração 7 dias.
2. Email com link é enviado (TODO: services/notifications, Fase 1.2).
3. Novo membro clica no link, chama `acceptInvite(email, token, password)`.
4. Sistema cria usuário, profile e organization_members; marca convite como 'accepted'.

## Portabilidade

Quando sairmos de Supabase Cloud:
- As funções em `services/auth` precisam ser reescritas para chamar um serviço de auth próprio (ex: uma API Node.js com Passport ou Auth0).
- Os schemas `SignupInput`, `LoginInput`, etc. **não mudam**.
- O contrato de erro também não: todos os endpoints retornam `AuthResponse { success, error?, data? }`.

Sem essa camada, teríamos que mexer em 50+ componentes React quando migrássemos.

## Critério de sucesso

- Toda rota de auth passa por um desses exports.
- Um componente React nunca chama `supabase.auth` direto.
- Unit tests de cada função podem rodar sem tocar no banco (mockando respostas).
