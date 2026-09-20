import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { acceptInvite } from '@services/auth/invite.js';
import Logo from '../components/Logo';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Link de convite inválido ou expirado');
    }
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token || !email) {
      setError('Dados de convite ausentes');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres');
      setLoading(false);
      return;
    }

    const result = await acceptInvite(email, token, password);

    if (!result.success) {
      setError(result.error || 'Erro ao aceitar convite');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/auth/login');
    }, 3000);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md card text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-h2 mb-2">Bem-vindo!</h2>
          <p className="text-text-secondary mb-4">
            Sua conta foi criada e você foi adicionado à organização. Redirecionando...
          </p>
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
            <p className="text-text-secondary text-sm mt-2">{email}</p>
          </div>

          {!token || !email ? (
            <div className="p-4 bg-status-danger-bg text-status-danger-fg rounded-lg">
              <p className="font-medium mb-2">Convite inválido</p>
              <p className="text-sm mb-4">{error}</p>
              <Link to="/auth/login" className="btn-secondary block text-center">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-caption font-medium mb-2">Senha</label>
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Criando conta...' : 'Criar conta e aceitar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
