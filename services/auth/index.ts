import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Serviço de autenticação centralizado.
 * 
 * Regra crítica: nenhum componente de apps/web fala direto com Supabase Auth.
 * Toda chamada passa por aqui, que valida, registra em auditoria e delega ao Supabase.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// A service role key NUNCA deve ir para o bundle do navegador. Ela só existe
// aqui quando este arquivo roda em um ambiente de servidor (ex: Netlify Functions),
// nunca no build do frontend.
const supabaseServiceKey = typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente de serviço (para operações administrativas, aceita requests de outros serviços).
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Schemas de validação
export const SignupInput = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export type SignupInput = z.infer<typeof SignupInput>;

export const LoginInput = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type LoginInput = z.infer<typeof LoginInput>;

export const RecoverPasswordInput = z.object({
  email: z.string().email('E-mail inválido'),
});

export type RecoverPasswordInput = z.infer<typeof RecoverPasswordInput>;

export const ResetPasswordInput = z.object({
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  token: z.string().min(1, 'Token obrigatório'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

/**
 * Signup: cria um novo usuário e a organização piloto (apenas para o primeiro).
 * Depois de criar a conta, o usuário chama create_organization_with_owner
 * (ver db/migrations/0004_helper_functions.sql).
 */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  try {
    const validated = SignupInput.parse(input);

    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Sucesso: usuário criado, aguardando confirmação de e-mail
    return {
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: 'Verifique seu e-mail para confirmar a conta',
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
      error: 'Erro ao registrar. Tente novamente.',
    };
  }
}

/**
 * Login: autentica um usuário.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  try {
    const validated = LoginInput.parse(input);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Sucesso
    return {
      success: true,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        session: data.session,
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
      error: 'Erro ao fazer login. Tente novamente.',
    };
  }
}

/**
 * Logout: encerra a sessão atual.
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { message: 'Logout realizado com sucesso' },
    };
  } catch (err) {
    return {
      success: false,
      error: 'Erro ao fazer logout.',
    };
  }
}

/**
 * Recuperação de senha: envia link de reset por e-mail.
 */
export async function recoverPassword(
  input: RecoverPasswordInput
): Promise<AuthResponse> {
  try {
    const validated = RecoverPasswordInput.parse(input);

    const { error } = await supabase.auth.resetPasswordForEmail(
      validated.email,
      {
        redirectTo: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/reset-password`,
      }
    );

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        message: 'Se a conta existe, um link de recuperação foi enviado',
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
      error: 'Erro ao recuperar senha.',
    };
  }
}

/**
 * Reset de senha: muda a senha usando um token de recuperação.
 */
export async function resetPassword(
  input: ResetPasswordInput
): Promise<AuthResponse> {
  try {
    const validated = ResetPasswordInput.parse(input);

    const { error } = await supabase.auth.updateUser({
      password: validated.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { message: 'Senha alterada com sucesso' },
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
      error: 'Erro ao alterar senha.',
    };
  }
}

/**
 * Obter usuário atual autenticado.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user as AuthUser | null;
  } catch {
    return null;
  }
}

/**
 * Obter a sessão atual.
 */
export async function getSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}
