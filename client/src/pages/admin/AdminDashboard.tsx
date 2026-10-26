import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  Camera,
  Heart,
  Sliders,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { token, admin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleToggleVoting = async (newStatus: 'open' | 'closed' | 'paused') => {
    if (!confirm(`¿Confirmas cambiar el estado de la votación a: ${newStatus.toUpperCase()}?`)) return;
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voting_status: newStatus }),
      });
      fetchStats();
    } catch (e) {
      alert('Error al actualizar configuración');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-card rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-card rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-card border border-halloween-border">
        <div>
          <span className="text-xs font-bold text-halloween-orange uppercase tracking-wider">
            Comité Organizador FMVZ
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Panel de Control del Concurso
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Gestión en tiempo real de participantes, validación de fotografías y auditoría de votaciones.
          </p>
        </div>

        {/* Voting Status Quick Switch */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-surface-raised border border-halloween-border">
          <span className="text-xs font-semibold text-gray-400 pl-2">Votación:</span>
          {admin?.role === 'admin' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleVoting('open')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stats?.voting_status === 'open'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Abierta
              </button>
              <button
                onClick={() => handleToggleVoting('paused')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stats?.voting_status === 'paused'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pausada
              </button>
              <button
                onClick={() => handleToggleVoting('closed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stats?.voting_status === 'closed'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cerrada
              </button>
            </div>
          ) : (
            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
              stats?.voting_status === 'open' ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
            }`}>
              {stats?.voting_status?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Participants */}
        <div className="p-5 rounded-3xl bg-surface-card border border-halloween-border">
          <div className="flex items-center justify-between text-halloween-muted mb-2">
            <span className="text-xs font-semibold">Total Participantes</span>
            <Users className="w-5 h-5 text-halloween-purple-light" />
          </div>
          <div className="font-display font-extrabold text-3xl text-white">
            {stats?.total_participants || 0}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <span>Capacidad: {stats?.capacity_used_pct}% ({stats?.total_participants}/{stats?.capacity_limit})</span>
          </div>
          <div className="w-full h-1.5 bg-surface-raised rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-halloween-purple rounded-full"
              style={{ width: `${stats?.capacity_used_pct || 0}%` }}
            />
          </div>
        </div>

        {/* Approved Participants */}
        <div className="p-5 rounded-3xl bg-surface-card border border-halloween-border">
          <div className="flex items-center justify-between text-halloween-muted mb-2">
            <span className="text-xs font-semibold">Aprobados / Galería</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-emerald-400">
            {stats?.approved_count || 0}
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            Visibles para votación pública
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="p-5 rounded-3xl bg-surface-card border border-halloween-border">
          <div className="flex items-center justify-between text-halloween-muted mb-2">
            <span className="text-xs font-semibold">Fotos Pendientes</span>
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-amber-400">
            {(stats?.pending_count || 0) + (stats?.needs_correction_count || 0)}
          </div>
          <Link
            to="/admin/fotografias"
            className="text-[11px] text-halloween-orange hover:underline mt-2 inline-flex items-center gap-1"
          >
            <span>Revisar pendientes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Total Votes */}
        <div className="p-5 rounded-3xl bg-surface-card border border-halloween-border">
          <div className="flex items-center justify-between text-halloween-muted mb-2">
            <span className="text-xs font-semibold">Votos Válidos</span>
            <Heart className="w-5 h-5 text-halloween-orange" />
          </div>
          <div className="font-display font-extrabold text-3xl text-white">
            {stats?.total_votes || 0}
          </div>
          <Link
            to="/admin/resultados"
            className="text-[11px] text-halloween-lavender hover:underline mt-2 inline-flex items-center gap-1"
          >
            <span>Ver conteo en vivo</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/participantes"
          className="p-5 rounded-3xl bg-surface-card hover:bg-surface-raised border border-halloween-border transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-display font-bold text-base text-white">Gestionar Participantes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Crear, editar, importar CSV o exportar base</p>
          </div>
          <ArrowRight className="w-5 h-5 text-halloween-orange" />
        </Link>

        <Link
          to="/admin/fotografias"
          className="p-5 rounded-3xl bg-surface-card hover:bg-surface-raised border border-halloween-border transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-display font-bold text-base text-white">Mesa de Moderación</h3>
            <p className="text-xs text-gray-400 mt-0.5">Aprobar o rechazar fotografías de concursantes</p>
          </div>
          <ArrowRight className="w-5 h-5 text-halloween-purple-light" />
        </Link>

        <Link
          to="/admin/configuracion"
          className="p-5 rounded-3xl bg-surface-card hover:bg-surface-raised border border-halloween-border transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-display font-bold text-base text-white">Código QR & Horarios</h3>
            <p className="text-xs text-gray-400 mt-0.5">Generar cartel QR y controlar fechas de votación</p>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400" />
        </Link>
      </div>

      {/* Recent Audit Log */}
      <div className="p-6 rounded-3xl bg-surface-card border border-halloween-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Actividad Reciente del Sistema
            </h2>
            <p className="text-xs text-halloween-muted">
              Bitácora inmutable de eventos y cambios administrativos
            </p>
          </div>
          <Link
            to="/admin/auditoria"
            className="text-xs font-semibold text-halloween-orange hover:underline"
          >
            Ver bitácora completa ➔
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border text-gray-400">
                <th className="pb-3 font-semibold">Acción</th>
                <th className="pb-3 font-semibold">Entidad</th>
                <th className="pb-3 font-semibold">Motivo / Detalle</th>
                <th className="pb-3 font-semibold">Operador</th>
                <th className="pb-3 font-semibold text-right">Fecha/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {stats?.recent_audit?.map((log: any) => (
                <tr key={log.id} className="hover:bg-surface-raised/50">
                  <td className="py-3 font-mono font-bold text-halloween-lavender">
                    {log.action}
                  </td>
                  <td className="py-3 text-gray-300">
                    {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                  </td>
                  <td className="py-3 text-gray-400 max-w-xs truncate">
                    {log.reason || 'Sin motivo especificado'}
                  </td>
                  <td className="py-3 text-gray-300">
                    {log.admin_name || 'Sistema'}
                  </td>
                  <td className="py-3 text-gray-400 text-right whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
