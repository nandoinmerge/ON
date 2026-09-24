import { useState, useEffect, useRef } from 'react';
import { Paperclip, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import {
  uploadFile,
  deleteFile,
  getSignedUrl,
  listFilesForEntity,
  type StorageEntityType,
} from '@services/storage/index.js';

function fileNameFromPath(path: string): string {
  const parts = path.split('/');
  const last = parts[parts.length - 1];
  // remove o prefixo "{timestamp}-{randomId}-" que adicionamos no upload
  return last.replace(/^\d+-[a-z0-9]+-/, '');
}

export default function AttachmentsPanel({
  organizationId,
  entityType,
  entityId,
}: {
  organizationId: string;
  entityType: StorageEntityType;
  entityId: string;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [entityId]);

  async function load() {
    setLoading(true);
    const result = await listFilesForEntity(organizationId, entityType, entityId);
    if (result.data) setFiles(result.data);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    const result = await uploadFile(file, organizationId, entityType, entityId);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (inputRef.current) inputRef.current.value = '';
    load();
  }

  async function handleDownload(path: string) {
    const result = await getSignedUrl(path);
    if (result.data) window.open(result.data, '_blank');
  }

  async function handleDelete(path: string) {
    if (!confirm('Excluir este anexo?')) return;
    await deleteFile(path);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-caption font-medium">Anexos</label>
        <label className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer inline-flex items-center gap-1">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? 'Enviando...' : 'Adicionar arquivo'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-xs text-status-danger-fg mb-2">{error}</p>}

      {loading ? (
        <p className="text-xs text-text-tertiary">Carregando...</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-text-tertiary">Nenhum anexo ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {files.map((path) => (
            <div
              key={path}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-surface-muted rounded-lg"
            >
              <button
                onClick={() => handleDownload(path)}
                className="flex items-center gap-2 min-w-0 text-left text-xs text-text-primary hover:text-brand-600"
                title="Baixar"
              >
                <Paperclip size={12} className="shrink-0 text-text-tertiary" />
                <span className="truncate">{fileNameFromPath(path)}</span>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(path)}
                  className="p-1 rounded hover:bg-white text-text-secondary"
                  title="Baixar"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={() => handleDelete(path)}
                  className="p-1 rounded hover:bg-status-danger-bg hover:text-status-danger-fg text-text-secondary"
                  title="Excluir"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
