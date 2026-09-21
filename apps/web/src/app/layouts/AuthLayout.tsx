import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { getCurrentUser, logout } from '@services/auth/index.js';
import { getCurrentUserProfile } from '@services/db/index.js';
import DashboardPage from '../pages/DashboardPage';
import ClientesPage from '../pages/ClientesPage';
import ProjetosPage from '../pages/ProjetosPage';
import TarefasPage from '../pages/TarefasPage';
import FinanceiroPage from '../pages/FinanceiroPage';

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/app/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/app/financeiro', label: 'Financeiro', icon: Wallet },
];

export default function AuthLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-secondary">
        Carregando...
      </div>
    );
  }

  const initials = (profile?.full_name || user?.email || '?')
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Overlay para mobile quando o menu está aberto */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        profile={profile}
        user={user}
        initials={initials}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border-subtle px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-muted text-text-secondary"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <PageTitle />
        </header>

        {/* Routes */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/projetos" element={<ProjetosPage />} />
            <Route path="/tarefas" element={<TarefasPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const found = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.href : location.pathname.startsWith(item.href)
  );
  return <h1 className="text-h2 text-text-primary">{found?.label ?? 'Dashboard'}</h1>;
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  profile,
  user,
  initials,
  onLogout,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  profile: any;
  user: any;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <aside
      className={`
        group
        fixed lg:static inset-y-0 left-0 z-40
        ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-ink text-white flex flex-col shrink-0
        transition-[transform,width] duration-200
        relative overflow-hidden
      `}
    >
      {/* Efeito roxo sutil na lateral, ancorado no canto superior */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-600/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-brand-400/60 via-brand-600/20 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-center h-16 border-b border-white/10 px-4">
        {collapsed ? (
          <img
            src="/logo-icon-white.png"
            alt="ON Digital"
            className="shrink-0 object-contain"
            style={{ width: 36, height: 36 }}
          />
        ) : (
          <img
            src="/logo-lockup-white.png"
            alt="ON Digital"
            className="shrink-0 object-contain"
            style={{ height: 34, width: 'auto' }}
          />
        )}

        {/* Fechar (mobile): sempre visível, não depende de hover (touch não tem hover) */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-zinc-400"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>

        {/* Recolher/expandir (desktop): some por padrão, aparece só no hover da sidebar */}
        <button
          onClick={onToggleCollapse}
          className={`
            hidden lg:flex absolute top-1/2 -translate-y-1/2 p-1 rounded
            bg-ink hover:bg-white/10 text-zinc-400
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            ${collapsed ? '-right-3 border border-white/10' : 'right-3'}
          `}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="relative px-3 py-4 border-t border-white/10">
        <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-brand-400/30 border border-brand-400/40 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuário'}</p>
              <p className="text-xs text-zinc-400 truncate">{profile?.email || user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  end,
  collapsed,
}: {
  href: string;
  label: string;
  icon: any;
  end?: boolean;
  collapsed: boolean;
}) {
  const location = useLocation();
  const isActive = end ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${collapsed ? 'justify-center' : ''}
        ${
          isActive
            ? 'bg-brand-600/25 text-white'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className={isActive ? 'text-brand-400' : ''} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

