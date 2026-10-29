import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Camera,
  Heart,
  Sliders,
  FileText,
  LogOut,
  ExternalLink,
  Shield,
  BarChart3,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'En Vivo', path: '/admin/en-vivo', icon: Radio },
    { label: 'Participantes', path: '/admin/participantes', icon: Users },
    { label: 'Fotografías', path: '/admin/fotografias', icon: Camera },
    { label: 'Votos', path: '/admin/votos', icon: Heart },
    { label: 'Resultados', path: '/admin/resultados', icon: BarChart3 },
    { label: 'Configuración & QR', path: '/admin/configuracion', icon: Sliders },
    { label: 'Auditoría', path: '/admin/auditoria', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-halloween-white flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-[#0B0D1A] border-b md:border-b-0 md:border-r border-halloween-border/80 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Top Brand */}
          <div className="p-4 sm:p-5 border-b border-halloween-border/60 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#15182A] border border-halloween-purple/40 flex items-center justify-center overflow-hidden shadow-glow-purple">
                <img src="/logos/concurso-fmvz-square.jpg" alt="FMVZ Admin" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-white tracking-wider block">
                  FMVZ ADMIN
                </span>
                <span className="text-[10px] text-halloween-lavender">
                  Halloween 2026
                </span>
              </div>
            </Link>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              admin?.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {admin?.role}
            </span>
          </div>

          {/* Nav items */}
          <nav className="p-2 sm:p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-halloween-purple/20 text-halloween-lavender font-bold border border-halloween-purple/40 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-surface-raised'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-halloween-orange' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-3 sm:p-4 border-t border-halloween-border/60 space-y-2">
          <div className="p-2.5 rounded-xl bg-surface-raised border border-halloween-border text-xs">
            <span className="text-gray-400 block text-[10px]">Sesión activa:</span>
            <strong className="text-white block truncate">{admin?.name}</strong>
            <span className="text-gray-400 block truncate text-[11px]">{admin?.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-gray-300 bg-surface-raised hover:bg-surface-subtle transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver sitio público</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
