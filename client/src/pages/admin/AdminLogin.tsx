import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <div className="w-16 h-16 rounded-2xl bg-[#15182A] flex items-center justify-center mx-auto mb-3 border border-halloween-purple/40 shadow-glow-purple overflow-hidden">
              <img src="/logos/concurso-fmvz-square.jpg" alt="FMVZ Admin" className="w-full h-full object-cover" />
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
                  placeholder="admin@concurso.fmvz"
                  autoComplete="off"
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
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
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
        </div>
      </div>
    </div>
  );
};
