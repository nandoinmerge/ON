import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@services/auth/index.js';

// Páginas (lazy loading importarei depois)
import LoginPage from './app/pages/LoginPage';
import SignupPage from './app/pages/SignupPage';
import RecoverPasswordPage from './app/pages/RecoverPasswordPage';
import AcceptInvitePage from './app/pages/AcceptInvitePage';

// Layout para área autenticada (a implementar)
import AuthLayout from './app/layouts/AuthLayout';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Rotas públicas (sem autenticação) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/recover-password" element={<RecoverPasswordPage />} />
        <Route path="/auth/accept-invite" element={<AcceptInvitePage />} />

        {/* Rotas autenticadas */}
        {user ? (
          <Route path="/app/*" element={<AuthLayout />} />
        ) : (
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/app' : '/auth/login'} replace />} />
      </Routes>
    </Router>
  );
}
