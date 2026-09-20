import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '@services/auth/index.js';
import Logo from '../components/Logo';

export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações básicas
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

    const result = await signup({ email, password, fullName });

    if (!result.success) {
      setError(result.error || 'Erro ao registrar');
      setLoading(false);
      return;
    }

    // Sucesso
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
          <h2 className="text-h2 mb-2">Conta criada!</h2>
          <p className="text-text-secondary mb-4">
            Verifique seu e-mail para confirmar a conta. Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo />
            <h1 className="mt-4 text-h1">Criar conta</h1>
            <p className="text-text-secondary text-sm mt-2">ON Digital</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome completo */}
            <div>
              <label className="block text-caption font-medium mb-2">Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-text"
                placeholder="Seu nome"
                required
              />
            </div>

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

            {/* Confirmar senha */}
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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Link para login */}
          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">Já tem conta? </span>
            <Link to="/auth/login" className="font-medium">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
