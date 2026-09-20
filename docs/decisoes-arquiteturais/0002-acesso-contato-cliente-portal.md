# ADR 0002: Acesso do contato do cliente ao portal por convite com link, conta criada no primeiro acesso

## Status
Aceita.

## Contexto
Era preciso decidir se o contato de um cliente recebe uma conta própria (usuário e senha) já no momento em que é cadastrado como responsável pelo cliente, ou se o acesso começa por um convite via link e a conta só é criada quando o contato usa esse link pela primeira vez. Essa decisão foi delegada para a condução técnica.

## Decisão
Um registro em `client_contacts` pode existir sem nenhuma conta de autenticação associada. O campo `client_contacts.auth_user_id` fica nulo até o contato aceitar o convite.

O fluxo é:

1. Alguém da agência cadastra o contato do cliente em `client_contacts` (nome, e-mail, papel), sem criar conta nenhuma.
2. Quando a agência decide liberar acesso ao portal, cria um registro em `client_access` e dispara um convite por e-mail com um link de token de uso único e validade curta.
3. Ao abrir o link, o contato define uma senha, o Supabase Auth cria o usuário, e `client_contacts.auth_user_id` é preenchido nesse momento, nunca antes.
4. Enquanto o convite não é aceito, o contato aparece no sistema como "convite pendente", sem conseguir logar em lugar nenhum.

## Justificativa

* Evita contas órfãs: ninguém fica com usuário e senha criados para um acesso que talvez nunca use.
* Separa claramente "ter um contato cadastrado" de "ter permissão de acesso", que são decisões de negócio diferentes (nem todo contato de um cliente deve ver o portal).
* É o modelo mais simples de revogar: remover o registro em `client_access` tira o acesso sem precisar desativar a conta de autenticação em si.

## Consequências

* A política de RLS de `client_contacts` e `client_access` precisa tratar `auth_user_id` nulo como estado válido e comum, não como erro.
* O fluxo de convite depende de e-mail transacional funcionando desde a Fase 4 (portal do cliente), o que reforça a necessidade de `EMAIL_PROVIDER` configurado antes dessa fase.
* Tokens de convite precisam expirar (recomendado: 7 dias) e ser de uso único, registrados em auditoria quando usados.
