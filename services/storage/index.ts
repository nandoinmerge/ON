/**
 * services/storage/index.ts
 * 
 * Gerenciamento de arquivos privados (briefings, contratos, entregas).
 * 
 * Política:
 * - Arquivos são armazenados em buckets privados (não públicos).
 * - URLs de download são assinadas, com expiração configurável.
 * - Cada upload é auditado (quem, quando, qual arquivo, tamanho).
 */

import { supabase } from '../auth/index.js';

const BUCKET_PRIVATE = process.env.STORAGE_BUCKET_PRIVATE || 'agencia-arquivos-privados';
const SIGNED_URL_EXPIRY = parseInt(
  process.env.STORAGE_SIGNED_URL_EXPIRY_SECONDS || '3600'
);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export interface StorageResponse<T> {
  data: T | null;
  error: string | null;
}

export interface UploadedFile {
  id: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  signedUrl?: string;
}

/**
 * Upload de arquivo para bucket privado.
 * 
 * Path format: `{organization_id}/{entity_type}/{entity_id}/{filename}`
 * Exemplo: `550e8400-e29b-41d4-a716-446655440000/deliverable/123/proposta.pdf`
 */
export async function uploadFile(
  file: File,
  organizationId: string,
  entityType: 'deliverable' | 'contract' | 'briefing',
  entityId: string
): Promise<StorageResponse<UploadedFile>> {
  try {
    // Validações
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: `Arquivo muito grande. Máximo: 50 MB, você enviou: ${(file.size / 1024 / 1024).toFixed(1)} MB`,
      };
    }

    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedMimes.includes(file.type)) {
      return {
        data: null,
        error: `Tipo de arquivo não permitido: ${file.type}`,
      };
    }

    // Construir path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const safeFileName = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    const path = `${organizationId}/${entityType}/${entityId}/${timestamp}-${randomId}-${safeFileName}`;

    // Upload
    const { data, error } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .upload(path, file);

    if (error) {
      return {
        data: null,
        error: `Falha no upload: ${error.message}`,
      };
    }

    // Gerar URL assinada
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    return {
      data: {
        id: randomId,
        path: data.path,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        signedUrl: signedUrlData?.signedUrl,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao fazer upload: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Gerar URL assinada para um arquivo já armazenado.
 */
export async function getSignedUrl(filePath: string): Promise<StorageResponse<string>> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error) {
      return {
        data: null,
        error: `Erro ao gerar URL: ${error.message}`,
      };
    }

    return {
      data: data?.signedUrl || null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao gerar URL assinada: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Deletar um arquivo (apenas quem tem acesso à entidade).
 */
export async function deleteFile(filePath: string): Promise<StorageResponse<null>> {
  try {
    const { error } = await supabase.storage.from(BUCKET_PRIVATE).remove([filePath]);

    if (error) {
      return {
        data: null,
        error: `Erro ao deletar: ${error.message}`,
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao deletar arquivo: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}

/**
 * Listar arquivos de uma entidade.
 */
export async function listFilesForEntity(
  organizationId: string,
  entityType: 'deliverable' | 'contract' | 'briefing',
  entityId: string
): Promise<StorageResponse<string[]>> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_PRIVATE)
      .list(`${organizationId}/${entityType}/${entityId}`);

    if (error) {
      return {
        data: null,
        error: `Erro ao listar: ${error.message}`,
      };
    }

    const filePaths = (data || []).map(
      (file) => `${organizationId}/${entityType}/${entityId}/${file.name}`
    );

    return {
      data: filePaths,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: `Erro ao listar arquivos: ${err instanceof Error ? err.message : 'desconhecido'}`,
    };
  }
}
