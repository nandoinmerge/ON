import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { acceptInvite, getInvitationPreview } from '@services/auth/invite.js';
import Logo from '../components/Logo';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor de projeto',
  collaborator: 'Colaborador',
  finance: 'Financeiro',
};

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [preview, setPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState<'none' | 'confirmed' | 'needs_confirmation'>('none');

  useEffect(() => {
    if (!token) {
      setPreviewError('Link de convite inválido');
      setLoadingPreview(false);
      return;
    }
    loadPreview();
  }, [token]);

  async function loadPreview() {
    const result = await getInvitationPreview(token);
    if (result.error || !result.data || !result.data.valid) {
      setPreviewError('Este convite não é válido ou já expirou.');
    } else {
      setPreview(result.data);
    }
    setLoadingPreview(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }
    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres');
      return;
    }

    setLoading(true);
    const result = await acceptInvite(preview.email, token, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Erro ao aceitar convite');
      return;
    }

    if (result.data?.needsEmailConfirmation) {
      localStorage.setItem('on_digital_pending_invite_token', token);
      setSuccessState('needs_confirmation');
    } else {
      setSuccessState('confirmed');
      setTimeout(() => navigate('/app'), 2000);
    }
  }

  if (loadingPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <p className="text-text-secondary">Carregando convite...</p>
      </div>
    );
  }

  if (previewError || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md card text-center">
          <div className="mb-6">
            <Logo />
          </div>
          <p className="font-medium text-status-danger-fg mb-2">Convite inválido</p>
          <p className="text-sm text-text-secondary mb-4">{previewError}</p>
          <Link to="/auth/login" className="btn-secondary block text-center">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  if (successState === 'needs_confirmation') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md card text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-h2 mb-2">Quase lá!</h2>
          <p className="text-text-secondary mb-4">
            Confirme seu e-mail (verifique sua caixa de entrada) e depois faça login. Você entrará
            automaticamente em <strong>{preview.organization_name}</strong>.
          </p>
          <Link to="/auth/login" className="btn-primary block text-center">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  if (successState === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md card text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-h2 mb-2">Bem-vindo(a)!</h2>
          <p className="text-text-secondary">Redirecionando para o painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-8 text-center">
            <Logo />
            <h1 className="mt-4 text-h1">Aceitar convite</h1>
            <p className="text-text-secondary text-sm mt-2">
              Você foi convidado(a) para <strong>{preview.organization_name}</strong> como{' '}
              {ROLE_LABELS[preview.role] ?? preview.role}
            </p>
            <p className="text-text-tertiary text-xs mt-1">{preview.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-caption font-medium mb-2">Crie uma senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-text"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-caption font-medium mb-2">Confirmar senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-text"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Criando conta...' : 'Criar conta e entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
