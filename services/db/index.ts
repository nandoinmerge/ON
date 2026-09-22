/**
 * services/db/index.ts
 * 
 * Helpers para queries ao banco, sempre através do cliente Supabase.
 * Nunca chamadas diretas ao SQL, sempre pelos métodos do SDK.
 * 
 * Cada função é tipada e rethrow erros com contexto útil.
 */

import { supabase } from '../auth/index.js';

export interface DbResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Obter organizações do usuário autenticado.
 */
export async function getUserOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao buscar organizações: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Obter membros de uma organização (apenas se o usuário tem acesso).
 */
export async function getOrganizationMembers(organizationId: string) {
  try {
    const { data, error, count } = await supabase
      .from('organization_members')
      .select('id, profile_id, role, status, created_at, profiles(id, full_name, email)', {
        count: 'exact',
      })
      .eq('organization_id', organizationId);

    if (error) throw error;

    return {
      data: data || [],
      error: null,
      count: count || 0,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao buscar membros: ${err instanceof Error ? err.message : 'desconhecido'}`,
      count: 0,
    };
  }
}

/**
 * Obter o perfil do usuário autenticado.
 */
export async function getCurrentUserProfile() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name, email, role_default, created_at')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 116 = no rows

    return {
      data: data || null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao buscar perfil: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Atualizar o perfil do usuário.
 */
export async function updateUserProfile(updates: {
  full_name?: string;
  email?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data || null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao atualizar perfil: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Buscar convites pendentes para uma organização.
 */
export async function getPendingInvitations(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, token_expires_at, status, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao buscar convites: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Cancelar um convite.
 */
export async function cancelInvitation(invitationId: string) {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) throw error;

    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao cancelar convite: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Utility: tratador de erro padrão.
 */
export function handleDbError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'Erro desconhecido ao acessar o banco';
}

/**
 * Cliente 360: um cliente específico e tudo relacionado a ele.
 */
export async function getClientById(id: string) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, industry, status, health, contact_name, contact_email, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function getProjectsByClient(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status, priority, due_date, created_at')
      .eq('client_id', clientId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function getTasksByProjectIds(projectIds: string[]) {
  if (projectIds.length === 0) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, project_id, projects(id, name)')
      .in('project_id', projectIds)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function getBillingItemsByClient(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('billing_items')
      .select('id, description, amount, status, due_date, created_at')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Clientes: criar, editar, arquivar
 */
export async function createClient(input: {
  organization_id: string;
  name: string;
  industry?: string;
  status?: string;
  health?: string;
  contact_name?: string;
  contact_email?: string;
}) {
  try {
    const { data, error } = await supabase.from('clients').insert([input]).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function updateClient(id: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function archiveClient(id: string) {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Projetos: criar, editar, arquivar
 */
export async function createProject(input: {
  organization_id: string;
  client_id: string;
  name: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
}) {
  try {
    const { data, error } = await supabase.from('projects').insert([input]).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function updateProject(id: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function archiveProject(id: string) {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Tarefas: criar, editar, excluir
 */
export async function createTask(input: {
  organization_id: string;
  project_id: string;
  title: string;
  status?: string;
  assignee_profile_id?: string | null;
  due_date?: string | null;
}) {
  try {
    const { data, error } = await supabase.from('tasks').insert([input]).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function updateTask(id: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function deleteTask(id: string) {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Itens financeiros: criar, editar, excluir
 */
export async function createBillingItem(input: {
  organization_id: string;
  client_id?: string | null;
  description: string;
  amount: number;
  status?: string;
  due_date?: string | null;
}) {
  try {
    const { data, error } = await supabase.from('billing_items').insert([input]).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function updateBillingItem(id: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('billing_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

export async function deleteBillingItem(id: string) {
  try {
    const { error } = await supabase.from('billing_items').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}
export async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, industry, status, health, contact_name, contact_email, created_at')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Projetos (com nome do cliente já resolvido, para exibir no kanban)
 */
export async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status, priority, due_date, created_at, client_id, clients(id, name)')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Tarefas (com nome do projeto já resolvido)
 */
export async function getTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at, project_id, projects(id, name)')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}

/**
 * Itens financeiros (com nome do cliente já resolvido)
 */
export async function getBillingItems() {
  try {
    const { data, error } = await supabase
      .from('billing_items')
      .select('id, description, amount, status, due_date, created_at, client_id, clients(id, name)')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDbError(err) };
  }
}
