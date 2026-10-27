import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@fmvz.unam.mx');
  const [password, setPassword] = useState('Halloween2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Credenciales inválidas');
    }
  };

  const fillCredentials = (type: 'admin' | 'operator') => {
    if (type === 'admin') {
      setEmail('admin@fmvz.unam.mx');
      setPassword('Halloween2026!');
    } else {
      setEmail('operador@fmvz.unam.mx');
      setPassword('Operador2026!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090B14]">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al portal público</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 border border-halloween-purple/40 shadow-glow-purple space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-halloween-purple/20 text-halloween-purple-light flex items-center justify-center mx-auto mb-3 border border-halloween-purple/40 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-display font-black text-2xl text-white">
              Panel Administrativo
            </h1>
            <p className="text-xs text-halloween-muted mt-1">
              Segundo Concurso de Disfraces FMVZ 2026
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Correo institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-halloween-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fmvz.unam.mx"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-xs sm:text-sm text-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-halloween-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-xs sm:text-sm text-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-purple to-indigo-600 hover:from-halloween-purple-dark hover:to-halloween-purple shadow-glow-purple transition-all disabled:opacity-50"
            >
              {loading ? 'Validando credenciales...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border space-y-2 text-xs">
            <span className="text-[11px] font-bold text-halloween-orange uppercase tracking-wider block">
              Credenciales de prueba preconfiguradas:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="p-2 rounded-xl bg-surface-card hover:bg-surface-subtle text-left border border-halloween-border/50 text-[11px]"
              >
                <strong className="block text-amber-300">Administrador</strong>
                <span className="text-gray-400 block truncate">admin@fmvz.unam.mx</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('operator')}
                className="p-2 rounded-xl bg-surface-card hover:bg-surface-subtle text-left border border-halloween-border/50 text-[11px]"
              >
                <strong className="block text-blue-300">Operador</strong>
                <span className="text-gray-400 block truncate">operador@fmvz.unam.mx</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
