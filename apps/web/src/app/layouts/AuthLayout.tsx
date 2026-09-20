import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '@services/auth/index.js';
import { getCurrentUserProfile } from '@services/db/index.js';
import DashboardPage from '../pages/DashboardPage';

export default function AuthLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      navigate('/auth/login');
      return;
    }

    setUser(currentUser);
    const profileResult = await getCurrentUserProfile();
    setProfile(profileResult.data);
    setLoading(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/auth/login');
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-brand-600 text-white transition-all duration-300 border-r border-brand-700 flex flex-col`}
      >
        <div className="p-4 border-b border-brand-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h2 className="text-sm font-bold">ON Digital</h2>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-brand-700 rounded"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/app" label="Dashboard" open={sidebarOpen} />
          <NavItem href="/app/clientes" label="Clientes" open={sidebarOpen} />
          <NavItem href="/app/projetos" label="Projetos" open={sidebarOpen} />
          <NavItem href="/app/tarefas" label="Tarefas" open={sidebarOpen} />
          <NavItem href="/app/financeiro" label="Financeiro" open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-brand-700 space-y-2">
          {sidebarOpen && (
            <div className="text-xs mb-3">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-brand-200 text-xs">{profile?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm hover:bg-brand-700 rounded transition-colors text-left"
          >
            {sidebarOpen ? 'Sair' : '↓'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border-subtle px-6 py-4">
          <h1 className="text-h2 text-text-primary">Dashboard</h1>
        </header>

        {/* Routes */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<div>Clientes (em construção)</div>} />
            <Route path="/projetos" element={<div>Projetos (em construção)</div>} />
            <Route path="/tarefas" element={<div>Tarefas (em construção)</div>} />
            <Route path="/financeiro" element={<div>Financeiro (em construção)</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, label, open }: { href: string; label: string; open: boolean }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium truncate"
    >
      {open ? label : label[0]}
    </a>
  );
}
