import { supabase, supabaseAdmin } from './index.js';
import { z } from 'zod';

/**
 * Serviço de convites para membros da equipe.
 * 
 * Fluxo:
 * 1. Um admin/owner convida um novo membro (email + papel)
 * 2. Sistema gera um token de convite único
 * 3. Envia e-mail com link contendo o token (para a Fase 1.2 quando emails estiverem prontos)
 * 4. Novo membro usa o link para criar conta e aceita o convite
 * 5. organizaton_members.status muda de 'invited' para 'active'
 */

const InviteInput = z.object({
  organizationId: z.string().uuid('ID de organização inválido'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'manager', 'collaborator', 'finance']),
});

export type InviteInput = z.infer<typeof InviteInput>;

interface InviteResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  token_expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  created_by: string;
}

/**
 * Criar um convite para um novo membro.
 * 
 * Pré-requisitos:
 * - Quem chama deve ser owner ou admin da organização
 * - E-mail não pode estar já convidado ou ativo na organização
 * 
 * Nota: Esta versão é SÍNCRONA. Quando um worker de jobs for introduzido,
 * o envio de e-mail passa para background (ver ADR 0003).
 */
export async function inviteMember(
  input: InviteInput,
  invitedByUserId: string
): Promise<InviteResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Serviço administrativo não configurado',
      };
    }

    const validated = InviteInput.parse(input);

    // 1. Gerar token de convite (36 caracteres alfanuméricos)
    const token = generateInviteToken();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // 2. Criar registro de convite (usando Supabase admin para contornar RLS)
    const { data: invitationRecord, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert([
        {
          organization_id: validated.organizationId,
          email: validated.email,
          role: validated.role,
          token: hashToken(token),
          token_expires_at: tokenExpiresAt.toISOString(),
          status: 'pending',
          created_by: invitedByUserId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Erro ao criar convite: ${insertError.message}`,
      };
    }

    // 3. TODO: Enviar e-mail com link de aceitação
    // const emailResult = await sendInviteEmail(
    //   validated.email,
    //   token,
    //   validated.organizationId
    // );
    // if (!emailResult.success) {
    //   return {
    //     success: false,
    //     error: 'Convite criado, mas falhou ao enviar e-mail',
    //   };
    // }

    // 4. Retornar sucesso (o token não é exposição a pública aqui, só é usado em e-mail)
    return {
      success: true,
      data: {
        invitationId: invitationRecord?.id,
        email: validated.email,
        expiresAt: tokenExpiresAt,
        message: 'Convite enviado (implementação de e-mail em breve)',
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.errors[0].message,
      };
    }
    return {
      success: false,
      error: 'Erro ao convidar membro',
    };
  }
}

/**
 * Aceitar um convite: criar usuário e confirmar membership.
 * 
 * Fluxo:
 * 1. Validar o token (não expirado, match com o convite)
 * 2. Criar usuário Supabase Auth
 * 3. Criar profile
 * 4. Atualizar organization_members.status para 'active'
 * 5. Marcar convite como 'accepted'
 */
export async function acceptInvite(
  email: string,
  token: string,
  password: string
): Promise<InviteResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: 'Serviço administrativo não configurado',
      };
    }

    // 1. Buscar o convite pendente para este e-mail
    const { data: invitations, error: searchError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError || !invitations || invitations.length === 0) {
      return {
        success: false,
        error: 'Convite não encontrado ou já expirado',
      };
    }

    const invitation = invitations[0] as Invitation;

    // 2. Validar o token
    if (!verifyToken(token, invitation.token)) {
      return {
        success: false,
        error: 'Token inválido',
      };
    }

    if (new Date() > new Date(invitation.token_expires_at)) {
      return {
        success: false,
        error: 'Convite expirado',
      };
    }

    // 3. Criar usuário Supabase Auth (ainda sem profile, vai ser criado em 0002_create_profiles)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true, // Email já está confirmado via convite
      }
    );

    if (authError || !authData.user) {
      return {
        success: false,
        error: `Erro ao criar conta: ${authError?.message || 'desconhecido'}`,
      };
    }

    const userId = authData.user.id;

    // 4. Criar profile para este usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          organization_id: invitation.organization_id,
          full_name: email.split('@')[0], // Placeholder, pode ser atualizado depois
          email,
          role_default: invitation.role,
        },
      ]);

    if (profileError) {
      return {
        success: false,
        error: `Erro ao criar profile: ${profileError.message}`,
      };
    }

    // 5. Criar organization_members com status 'active'
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert([
        {
          organization_id: invitation.organization_id,
          profile_id: userId,
          role: invitation.role,
          status: 'active',
        },
      ]);

    if (memberError) {
      return {
        success: false,
        error: `Erro ao adicionar à organização: ${memberError.message}`,
      };
    }

    // 6. Marcar convite como aceito
    await supabaseAdmin
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    return {
      success: true,
      data: {
        userId,
        email,
        message: 'Conta criada e convite aceito com sucesso',
      },
    };
  } catch (err) {
    return {
      success: false,
      error: 'Erro ao aceitar convite',
    };
  }
}

/**
 * Utilitários de token
 */

function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function hashToken(token: string): string {
  // Placeholder: em produção, usar bcrypt ou argon2
  // Para desenvolvimento, usar uma função hash simples (NOT segura)
  return Buffer.from(token).toString('base64');
}

function verifyToken(plainToken: string, hashedToken: string): boolean {
  return hashToken(plainToken) === hashedToken;
}
