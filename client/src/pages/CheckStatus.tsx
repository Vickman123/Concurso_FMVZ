import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';

export const CheckStatus: React.FC = () => {
  const [folio, setFolio] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{
    contest_number: number;
    public_display_name: string;
    costume_title: string;
    status: string;
    status_message: string;
    registered_at: string;
  } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio.trim() || !identifier.trim()) {
      setError('Ingresa el folio de registro y tu identificador institucional');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusResult(null);

    try {
      const res = await fetch('/api/participants/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_folio: folio.trim(),
          institutional_identifier: identifier.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se encontró el registro solicitado');
      }

      setStatusResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al consultar el estado');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">Aprobado para la Galería Oficial</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">Pendiente de Revisión por el Comité</span>
          </div>
        );
      case 'needs_correction':
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">Requiere Correcciones en la Fotografía</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">No Aprobado / Inactivo</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 safe-bottom">
      <div className="text-center mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-halloween-white">
          Consulta de Estado del Registro
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-2 max-w-sm mx-auto">
          Ingresa tu folio de registro y número de cuenta o identificación para conocer la validación de tu fotografía.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border/90 shadow-card">
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Folio único de registro
            </label>
            <input
              type="text"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej. FMVZ-REG-2026-0001"
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm font-mono text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Identificador institucional (9 dígitos estudiante o 6 dígitos trabajador)
            </label>
            <input
              type="password"
              maxLength={9}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
              placeholder="•••••••••"
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm font-mono text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark shadow-glow-purple flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Consultando sistema...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Consultar estado</span>
              </>
            )}
          </button>
        </form>

        {/* Results Area */}
        {statusResult && (
          <div className="mt-8 pt-6 border-t border-halloween-border/60 space-y-4 animate-fadeIn">
            {getStatusBadge(statusResult.status)}

            <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Número oficial:</span>
                <strong className="text-halloween-white font-mono">#{String(statusResult.contest_number).padStart(2, '0')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disfraz:</span>
                <strong className="text-halloween-white">{statusResult.costume_title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nombre público:</span>
                <strong className="text-halloween-lavender">{statusResult.public_display_name}</strong>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-surface-raised/40 p-3 rounded-xl border border-halloween-border/50">
              {statusResult.status_message}
            </p>

            {statusResult.status === 'approved' && (
              <Link
                to={`/participantes/${statusResult.contest_number}`}
                className="w-full block py-2.5 rounded-xl font-bold text-xs text-center text-white bg-halloween-orange hover:bg-halloween-orange-dark"
              >
                Ver mi disfraz en la galería pública
              </Link>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-halloween-border/40 flex items-center justify-center gap-2 text-[11px] text-halloween-muted">
          <Shield className="w-3.5 h-3.5 text-halloween-purple" />
          <span>Mecanismo seguro de consulta con validación de identidad.</span>
        </div>
      </div>
    </div>
  );
};
