import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recoverPassword } from '@services/auth/index.js';
import Logo from '../components/Logo';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await recoverPassword({ email });

    if (!result.success) {
      setError(result.error || 'Erro ao enviar link');
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md card text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-h2 mb-2">Link enviado!</h2>
          <p className="text-text-secondary mb-4">
            Se a conta existe, um link de recuperação foi enviado para o seu e-mail. 
            Verifique sua caixa de entrada ou spam.
          </p>
          <Link to="/auth/login" className="btn-secondary">
            Voltar ao login
          </Link>
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
            <h1 className="mt-4 text-h1">Recuperar senha</h1>
            <p className="text-text-secondary text-sm mt-2">Digite seu e-mail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/auth/login" className="font-medium">
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
