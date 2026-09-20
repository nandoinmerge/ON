# ADR 0003: Notificações e e-mails começam síncronos, worker entra de forma incremental

## Status
Aceita.

## Contexto
Era preciso decidir se o worker de tarefas assíncronas (envio de e-mail, notificações) entra já na Fase 1 ou fica adiado. A orientação recebida foi para incrementar aos poucos em vez de decidir uma data fixa.

## Decisão
`services/notifications` começa com uma implementação síncrona: quando uma ação relevante acontece (convite de usuário, aprovação, comentário), o próprio request que originou a ação chama o provedor de e-mail diretamente, sem fila.

A interface do serviço já é escrita de um jeito que não muda quando a fila for introduzida:

```ts
interface NotificationService {
  sendInvite(input: InviteInput): Promise<void>;
  sendApprovalRequest(input: ApprovalInput): Promise<void>;
  notifyInApp(input: InAppNotificationInput): Promise<void>;
}
```

Quando o volume de e-mails, a latência percebida pelo usuário, ou a necessidade de reprocessar falhas justificarem, a implementação por trás dessa mesma interface passa a publicar em uma fila (por exemplo, uma tabela `job_queue` consumida por um worker Docker na VPS), sem que o código que chama `NotificationService` precise mudar.

## Critério objetivo para introduzir o worker
Qualquer um destes sinais já é suficiente:

* Uma rota da aplicação demora mais de 1,5 segundo por causa de uma chamada de e-mail dentro dela.
* Uma falha de envio de e-mail hoje significa que a notificação simplesmente não acontece, sem nova tentativa.
* O volume de e-mails transacionais passa de um patamar que comece a gerar rate limit no provedor.

## Consequências

* Entrega mais rápida na Fase 1, sem worker, sem fila, sem infraestrutura extra.
* Fica registrado desde já que a introdução do worker não é um "talvez", é uma questão de quando os sinais acima aparecerem, e que ela não deve exigir reescrever quem chama `NotificationService`.
