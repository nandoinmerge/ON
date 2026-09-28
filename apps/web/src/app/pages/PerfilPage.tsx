import { useState, useEffect, useRef } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import { getCurrentUserProfile, updateUserProfile } from '@services/db/index.js';
import { getCurrentUser } from '@services/auth/index.js';
import { uploadFile, deleteFile, getSignedUrl } from '@services/storage/index.js';

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [profileResult, user] = await Promise.all([getCurrentUserProfile(), getCurrentUser()]);
    if (profileResult.data) {
      setProfile(profileResult.data);
      setFullName(profileResult.data.full_name || '');
      setOrganizationId(profileResult.data.organization_id);
      if (profileResult.data.avatar_url) {
        const signed = await getSignedUrl(profileResult.data.avatar_url);
        if (signed.data) setAvatarSignedUrl(signed.data);
      }
    }
    setUserId(user?.id ?? null);
    setLoading(false);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!fullName.trim()) {
      setError('Digite um nome');
      return;
    }
    setSaving(true);
    const result = await updateUserProfile({ full_name: fullName.trim() });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage('Nome atualizado!');
    load();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !organizationId || !userId) return;

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem (JPG, PNG ou WEBP)');
      return;
    }

    setError('');
    setUploadingPhoto(true);

    // Remove a foto anterior, se existir, antes de subir a nova.
    if (profile?.avatar_url) {
      await deleteFile(profile.avatar_url);
    }

    const result = await uploadFile(file, organizationId, 'avatar', userId);
    if (result.error || !result.data) {
      setUploadingPhoto(false);
      setError(result.error || 'Erro ao enviar foto');
      return;
    }

    const updateResult = await updateUserProfile({ avatar_url: result.data.path });
    setUploadingPhoto(false);
    if (updateResult.error) {
      setError(updateResult.error);
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    load();
  }

  if (loading) {
    return <div className="card h-64 animate-pulse bg-surface-muted" />;
  }

  const initials = (fullName || profile?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg space-y-6">
      <div className="card">
        <h2 className="text-h2 mb-5">Foto de perfil</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden shrink-0">
            {avatarSignedUrl ? (
              <img src={avatarSignedUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-brand-600">{initials}</span>
            )}
          </div>
          <div>
            <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
              {uploadingPhoto ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
            <p className="text-xs text-text-tertiary mt-2">JPG, PNG ou WEBP</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-h2 mb-5 flex items-center gap-2">
          <User size={18} />
          Nome de exibição
        </h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-caption font-medium mb-1.5">Nome</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-text"
              placeholder="Como você quer ser chamado no sistema"
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              É esse nome que aparece na barra lateral e em qualquer lugar do sistema no seu lugar.
            </p>
          </div>

          {error && <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">{error}</div>}
          {message && (
            <div className="p-3 bg-status-success-bg text-status-success-fg rounded-lg text-sm">{message}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar nome'}
          </button>
        </form>
      </div>
    </div>
  );
}
