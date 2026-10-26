import React, { useState, useEffect } from 'react';
import { FileText, Shield, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuditLogItem } from '../../types';

export const AdminAudit: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      (log.reason && log.reason.toLowerCase().includes(s)) ||
      (log.admin_name && log.admin_name.toLowerCase().includes(s)) ||
      log.entity_type.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Bitácora Inmutable de Auditoría
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Registro de trazabilidad y rendición de cuentas del certamen ({logs.length} eventos registrados).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-xl bg-surface-card hover:bg-surface-raised text-gray-300 hover:text-white border border-halloween-border self-start sm:self-auto"
          title="Actualizar bitácora"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex items-center gap-3">
        <Search className="w-4 h-4 text-halloween-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por acción, operador o motivo..."
          className="w-full bg-transparent text-xs text-white placeholder-halloween-muted focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Acción Realizada</th>
                <th className="py-3 px-4 font-semibold">Entidad Afectada</th>
                <th className="py-3 px-4 font-semibold">Motivo / Justificación</th>
                <th className="py-3 px-4 font-semibold">Operador</th>
                <th className="py-3 px-4 font-semibold text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-500">
                    #{log.id}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-halloween-lavender">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-sm">
                    {log.reason || 'Sin justificación registrada'}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {log.admin_name || 'Sistema Automático'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-right whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
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
