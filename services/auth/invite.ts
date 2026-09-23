import { supabase } from './index.js';
import { z } from 'zod';

/**
 * Serviço de convites para membros da equipe.
 *
 * Arquitetura (revisada): nenhuma etapa deste fluxo usa a service role key
 * no navegador. O convite é uma linha normal em `invitations`, inserida
 * pelo owner/admin autenticado (RLS já garante que só eles podem inserir).
 * O convidado se cadastra pelo signup normal (anon key) e chama
 * `accept_invitation`, uma função SECURITY DEFINER que só afeta a própria
 * conta dele. Ver ADR 0004 (atualizada) e a migration accept_invitation.
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

/**
 * Criar um convite para um novo membro. Quem chama precisa ser owner ou
 * admin da organização (garantido pela política de RLS de `invitations`,
 * não só nesta função).
 */
export async function inviteMember(input: InviteInput): Promise<InviteResponse> {
  try {
    const validated = InviteInput.parse(input);

    // Token: string aleatória usada só como parte do link, nunca como senha.
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          organization_id: validated.organizationId,
          email: validated.email.toLowerCase(),
          role: validated.role,
          token,
          token_expires_at: tokenExpiresAt.toISOString(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      // Convite duplicado (mesmo e-mail já convidado nesta organização)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Este e-mail já tem um convite pendente ou já é membro da organização.',
        };
      }
      return { success: false, error: error.message };
    }

    const acceptUrl = `${window.location.origin}/auth/accept-invite?token=${token}`;

    return {
      success: true,
      data: {
        invitationId: data.id,
        email: validated.email,
        acceptUrl,
        expiresAt: tokenExpiresAt,
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    return { success: false, error: 'Erro ao convidar membro' };
  }
}

/**
 * Buscar informações públicas de um convite pelo token (antes de logar).
 * Usa a função get_invitation_preview, que não exige autenticação.
 */
export async function getInvitationPreview(token: string) {
  try {
    const { data, error } = await supabase.rpc('get_invitation_preview', { p_token: token });
    if (error) throw error;
    const preview = Array.isArray(data) ? data[0] : data;
    if (!preview) {
      return { data: null, error: 'Convite não encontrado' };
    }
    return { data: preview, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Erro ao buscar convite' };
  }
}

/**
 * Aceitar um convite: cria a conta (signup normal) e, assim que autenticado,
 * chama accept_invitation para entrar na organização.
 */
export async function acceptInvite(
  email: string,
  token: string,
  password: string
): Promise<InviteResponse> {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    // Se o Supabase já retornou uma sessão (confirmação de e-mail desligada),
    // já dá para aceitar o convite agora mesmo.
    if (signUpData.session) {
      const { error: acceptError } = await supabase.rpc('accept_invitation', { p_token: token });
      if (acceptError) {
        return { success: false, error: acceptError.message };
      }
      return { success: true, data: { needsEmailConfirmation: false } };
    }

    // Senão, o convite será aceito automaticamente no primeiro login
    // (ver AuthLayout: tenta accept_invitation quando não existe profile).
    return { success: true, data: { needsEmailConfirmation: true } };
  } catch (err) {
    return { success: false, error: 'Erro ao aceitar convite' };
  }
}

/**
 * Tentar aceitar um convite pendente para o usuário já autenticado no
 * momento (chamado quando alguém loga e ainda não tem profile).
 */
export async function tryAcceptPendingInvitation(token: string): Promise<InviteResponse> {
  try {
    const { error } = await supabase.rpc('accept_invitation', { p_token: token });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Erro ao aceitar convite' };
  }
}
