import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Participant } from '../../types';

export const AdminParticipants: React.FC = () => {
  const { token, admin } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Status Modal
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [newStatus, setNewStatus] = useState<string>('approved');
  const [statusReason, setStatusReason] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [statusFilter, typeFilter, search, token]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/participants/${selectedParticipant.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, reason: statusReason }),
      });
      if (res.ok) {
        setSelectedParticipant(null);
        setStatusReason('');
        fetchParticipants();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al actualizar estado');
      }
    } catch (err: any) {
      alert('Error al conectar con el servidor');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/admin/participants/import-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        fetchParticipants();
      }
    } catch (err: any) {
      setImportResult({ error: 'Error al subir archivo CSV' });
    } finally {
      setImporting(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/admin/participants/export-csv?auth=${token}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Aprobado</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">Pendiente</span>;
      case 'needs_correction':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400">Corrección</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-400">Inactivo</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Participantes Registrados
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Administración de concursantes ({participants.length} registros).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {admin?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-halloween-lavender bg-surface-raised hover:bg-surface-subtle border border-halloween-border flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar CSV</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 bg-surface-raised hover:bg-surface-subtle border border-halloween-border flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-halloween-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, título, número o cuenta..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobados</option>
            <option value="pending">Pendientes</option>
            <option value="needs_correction">Requiere corrección</option>
            <option value="rejected">Rechazados</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white focus:outline-none"
          >
            <option value="all">Estudiantes y trabajadores</option>
            <option value="student">Estudiantes</option>
            <option value="worker">Trabajadores</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Foto</th>
                <th className="py-3 px-4 font-semibold">Disfraz</th>
                <th className="py-3 px-4 font-semibold">Nombre Público</th>
                <th className="py-3 px-4 font-semibold">Nombre Real (Privado)</th>
                <th className="py-3 px-4 font-semibold">Identificador</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {participants.map((p) => (
                <tr key={p.contest_number} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-halloween-orange">
                    #{String(p.contest_number).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4">
                    <img
                      src={p.photo_original_key}
                      alt=""
                      className="w-10 h-12 rounded-lg object-cover border border-halloween-purple/30"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-white block">{p.costume_title}</strong>
                    <span className="text-[10px] text-gray-400">{p.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}</span>
                  </td>
                  <td className="py-3 px-4 text-halloween-lavender font-semibold">
                    {p.public_display_name}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {p.full_name || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-400">
                    {p.institutional_identifier || '—'}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedParticipant(p);
                        setNewStatus(p.status);
                        setStatusReason('');
                      }}
                      className="p-1.5 rounded-lg bg-surface-raised hover:bg-halloween-purple/20 text-gray-300 hover:text-white transition-colors"
                      title="Cambiar estado"
                    >
                      <Edit2 className="w-4 h-4 text-halloween-purple-light" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-card border border-halloween-purple/40 p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white">
              Moderar Participante #{String(selectedParticipant.contest_number).padStart(2, '0')}
            </h3>
            <p className="text-xs text-gray-300">
              {selectedParticipant.costume_title} — {selectedParticipant.public_display_name}
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nuevo estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white"
                >
                  <option value="approved">Aprobado (Visible en galería pública)</option>
                  <option value="pending">Pendiente (En revisión)</option>
                  <option value="needs_correction">Requiere corrección de foto</option>
                  <option value="rejected">Rechazado</option>
                  <option value="inactive">Inactivo (Desactivado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Motivo de la moderación (Bitácora de auditoría)
                </label>
                <textarea
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ej. Fotografía de excelente calidad validada según bases."
                  className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-surface-raised"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-halloween-purple hover:bg-halloween-purple-dark"
                >
                  {updatingStatus ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-surface-card border border-halloween-border p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white">
              Importar Participantes mediante CSV
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Sube un archivo CSV con las columnas: <code>nombre_completo, titulo_disfraz, tipo_participante, identificador_institucional</code>. El sistema detectará y omitirá automáticamente registros con identificadores duplicados.
            </p>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-halloween-purple file:text-white"
              />

              {importResult && (
                <div className={`p-3 rounded-xl text-xs ${importResult.success ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800' : 'bg-red-950/40 text-red-200 border border-red-800'}`}>
                  {importResult.message || importResult.error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowImportModal(false); setImportResult(null); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-surface-raised"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-halloween-orange hover:bg-halloween-orange-dark disabled:opacity-50"
                >
                  {importing ? 'Procesando...' : 'Iniciar Importación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
