import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@services/auth/index.js';
import Logo from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
      setLoading(false);
      return;
    }

    // Sucesso: redirecionar para o app
    navigate('/app');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo />
            <h1 className="mt-4 text-h1">ON Digital</h1>
            <p className="text-text-secondary text-sm mt-2">Sistema de Gestão</p>
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
