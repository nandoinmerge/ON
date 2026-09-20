/**
 * services/notifications/index.ts
 * 
 * Serviço centralizado de notificações (e-mail).
 * 
 * Nota: implementação é SÍNCRONA agora (ADR 0003).
 * Quando volume de e-mails exigir, a implementação por trás dessa interface
 * passa a usar uma fila de jobs, sem que o código que chama mude.
 * 
 * Provedor: começar com Resend (https://resend.com) por ser simples e gratuito
 * (alternativas: SendGrid, AWS SES, ou um worker Docker com Nodemailer em produção).
 */

import { z } from 'zod';

const NotificationConfig = {
  provider: process.env.EMAIL_PROVIDER || 'resend',
  apiKey: process.env.EMAIL_API_KEY || '',
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'nao-responda@ondigital.local',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
};

export interface NotificationResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Enviar convite para um novo membro da equipe.
 */
export async function sendInviteEmail(
  recipientEmail: string,
  inviteToken: string,
  organizationName: string,
  inviterName: string
): Promise<NotificationResponse> {
  const acceptUrl = `${NotificationConfig.appUrl}/auth/accept-invite?token=${inviteToken}&email=${encodeURIComponent(recipientEmail)}`;

  const htmlBody = `
    <h2>Você foi convidado para ${organizationName}</h2>
    <p>${inviterName} convidou você para colaborar em projetos na agência ON Digital.</p>
    <p>
      <a href="${acceptUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #1A5686;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      ">
        Aceitar convite
      </a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p><code>${acceptUrl}</code></p>
    <p style="color: #98A2B0; font-size: 12px;">
      Este link expira em 7 dias. Se você não esperava este convite, ignore este e-mail.
    </p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Convite para ${organizationName}`,
    html: htmlBody,
    text: `Você foi convidado para ${organizationName}. Clique em: ${acceptUrl}`,
  });
}

/**
 * Enviar confirmação de e-mail após signup.
 */
export async function sendConfirmationEmail(
  recipientEmail: string,
  confirmationLink: string
): Promise<NotificationResponse> {
  const htmlBody = `
    <h2>Confirme seu e-mail</h2>
    <p>Clique no link abaixo para confirmar sua conta:</p>
    <p>
      <a href="${confirmationLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #1A5686;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      ">
        Confirmar e-mail
      </a>
    </p>
    <p>Ou copie e cole este link:</p>
    <p><code>${confirmationLink}</code></p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Confirme seu e-mail',
    html: htmlBody,
    text: `Clique para confirmar: ${confirmationLink}`,
  });
}

/**
 * Enviar link de recuperação de senha.
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetLink: string
): Promise<NotificationResponse> {
  const htmlBody = `
    <h2>Recupere sua senha</h2>
    <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo:</p>
    <p>
      <a href="${resetLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #1A5686;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      ">
        Redefinir senha
      </a>
    </p>
    <p>Ou copie e cole este link:</p>
    <p><code>${resetLink}</code></p>
    <p style="color: #98A2B0; font-size: 12px;">
      Este link expira em 24 horas. Se você não solicitou uma redefinição, ignore este e-mail.
    </p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: 'Redefinir sua senha',
    html: htmlBody,
    text: `Clique para redefinir sua senha: ${resetLink}`,
  });
}

/**
 * Enviar notificação de aprovação pendente (para manager).
 */
export async function sendApprovalPendingEmail(
  recipientEmail: string,
  projectName: string,
  deliverableName: string,
  approvalLink: string
): Promise<NotificationResponse> {
  const htmlBody = `
    <h2>Aprovação pendente: ${deliverableName}</h2>
    <p>O cliente <strong>${projectName}</strong> enviou uma entrega aguardando sua aprovação.</p>
    <p>
      <a href="${approvalLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #FF6A28;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      ">
        Revisar entrega
      </a>
    </p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Aprovação pendente: ${deliverableName}`,
    html: htmlBody,
    text: `Entrega pendente: ${deliverableName}. Link: ${approvalLink}`,
  });
}

/**
 * Função baixo-nível de envio de e-mail.
 */
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(input: SendEmailInput): Promise<NotificationResponse> {
  if (!NotificationConfig.apiKey) {
    console.warn(
      '[EMAIL] Nenhuma chave de API configurada. E-mail não será enviado (modo desenvolvimento).'
    );
    return {
      success: true,
      messageId: 'dev-mock-' + Date.now(),
    };
  }

  try {
    // TODO: implementar suporte para Resend, SendGrid, etc.
    // Por enquanto, apenas log em desenvolvimento.
    console.log('[EMAIL]', {
      to: input.to,
      subject: input.subject,
      provider: NotificationConfig.provider,
    });

    return {
      success: true,
      messageId: 'mock-' + Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: `Falha ao enviar e-mail: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * In-app notifications (será implementado em services/notifications/in-app.ts na Fase 3).
 */
export async function notifyInApp(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error'
): Promise<NotificationResponse> {
  // TODO: criar tabela notifications, inserir linha, disparar realtime
  console.log('[IN-APP-NOTIFICATION]', { userId, title, message, type });
  return { success: true };
}
