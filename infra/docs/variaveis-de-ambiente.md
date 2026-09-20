# Variáveis de ambiente

Todas as variáveis abaixo vivem apenas em `.env` local ou no gerenciador de segredos do ambiente de deploy. Nenhuma delas é commitada. `.env.example` documenta os nomes, nunca os valores.

## Supabase (ambiente de teste)

| Variável | Usada em | Descrição |
|---|---|---|
| `SUPABASE_URL` | `services/db`, `services/auth`, `services/storage` | Endpoint do projeto Supabase de teste. |
| `SUPABASE_ANON_KEY` | Frontend, via `services` | Chave pública, respeita RLS. Segura para uso no navegador. |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas `services` (backend) | Ignora RLS. Nunca deve chegar ao frontend ou a logs. |

## Banco de dados

| Variável | Usada em | Descrição |
|---|---|---|
| `DATABASE_URL` | Scripts de migration, seeds, backup | Conexão direta ao PostgreSQL, usada fora do runtime da aplicação. |

## Autenticação

| Variável | Usada em | Descrição |
|---|---|---|
| `AUTH_REDIRECT_URL` | `services/auth` | URL de retorno após confirmação de e-mail ou login social. |
| `AUTH_MFA_ENFORCED_ROLES` | `services/auth` | Lista de papéis que exigem MFA antes de operar com dados reais. |

## Storage

| Variável | Usada em | Descrição |
|---|---|---|
| `STORAGE_BUCKET_PRIVATE` | `services/storage` | Nome do bucket privado para arquivos sensíveis (contratos, briefings, entregas não publicadas). |
| `STORAGE_SIGNED_URL_EXPIRY_SECONDS` | `services/storage` | Tempo de vida das URLs assinadas geradas sob demanda. |

## E-mail transacional

| Variável | Usada em | Descrição |
|---|---|---|
| `EMAIL_PROVIDER` | `services/notifications` | Provedor usado para convites, notificações e recuperação de senha. |
| `EMAIL_API_KEY` | `services/notifications` | Credencial do provedor de e-mail. |
| `EMAIL_FROM_ADDRESS` | `services/notifications` | Remetente padrão das mensagens transacionais. |

## Aplicação

| Variável | Usada em | Descrição |
|---|---|---|
| `APP_URL` | Frontend, e-mails transacionais | URL base usada em links de convite, aprovação e recuperação de senha. |
| `NODE_ENV` | Build e runtime | `development`, `test` ou `production`. |

## Backups

| Variável | Usada em | Descrição |
|---|---|---|
| `BACKUP_STORAGE_PROVIDER` | `infra/docker` (worker de backup) | Destino do backup automático (fora do mesmo servidor de produção). |
| `BACKUP_RETENTION_DAYS` | `infra/docker` (worker de backup) | Retenção mínima definida antes de qualquer dado real de cliente entrar no sistema. |

## Observabilidade

| Variável | Usada em | Descrição |
|---|---|---|
| `SENTRY_DSN` | Frontend e services | Preenchida a partir da Fase 6 (qualidade e preparação de escala). |

## Regra geral

Ao migrar de Supabase Cloud para Supabase self-hosted ou backend próprio, todas as variáveis desta lista precisam ser revalidadas uma a uma. Nenhuma delas migra sozinha.
