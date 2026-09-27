import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, resendConfirmationEmail } from '@services/auth/index.js';
import Logo from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
      setLoading(false);
      if (result.error?.toLowerCase().includes('email not confirmed')) {
        setShowResend(true);
      }
      return;
    }

    // Sucesso: redirecionar para o app
    navigate('/app');
  }

  async function handleResend() {
    setResendMessage('');
    if (!email) {
      setResendMessage('Digite seu e-mail no campo acima primeiro');
      return;
    }
    setResending(true);
    const result = await resendConfirmationEmail(email);
    setResending(false);
    setResendMessage(
      result.success ? 'E-mail reenviado! Confira sua caixa de entrada (e o spam).' : result.error || 'Erro ao reenviar'
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo height={48} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-caption font-medium mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-text"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
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

            {/* Erro */}
            {error && (
              <div className="p-3 bg-status-danger-bg text-status-danger-fg rounded-lg text-sm">
                {error}
              </div>
            )}

            {showResend && (
              <div className="p-3 bg-status-warning-bg text-status-warning-fg rounded-lg text-sm space-y-2">
                <p>Sua conta ainda não confirmou o e-mail.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium underline disabled:opacity-50"
                >
                  {resending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                </button>
                {resendMessage && <p className="text-xs">{resendMessage}</p>}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-2 text-center text-sm">
            <div>
              <span className="text-text-secondary">Não tem conta? </span>
              <Link to="/auth/signup" className="font-medium">
                Criar nova
              </Link>
            </div>
            <div>
              <Link to="/auth/recover-password" className="text-text-tertiary hover:text-text-secondary">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
