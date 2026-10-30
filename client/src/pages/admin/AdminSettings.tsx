import React, { useState, useEffect } from 'react';
import { Sliders, QrCode, Download, Save, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CustomQrWithLogo } from '../../components/CustomQrWithLogo';

export const AdminSettings: React.FC = () => {
  const { token, admin } = useAuth();

  const [votingStatus, setVotingStatus] = useState('open');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [regLimit, setRegLimit] = useState(100);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al generar respaldo en el servidor');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_fmvz_halloween_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Error al descargar el respaldo: ' + e.message);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contest/settings');
      if (res.ok) {
        const data = await res.json();
        setVotingStatus(data.voting_status || 'open');
        setIsLiveActive(Boolean(data.is_live_active));
        setRegLimit(data.registration_limit || 100);
        setTotalRegistered(data.total_registered || 0);
      }

      // Generate QR
      const publicUrl = window.location.origin;
      const qrRes = await fetch(`/api/admin/qr?url=${encodeURIComponent(publicUrl)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrDataUrl(qrData.qr_data_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voting_status: votingStatus,
          is_live_active: isLiveActive,
          registration_limit: Number(regLimit),
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Error al guardar configuración');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
          Configuración Global del Evento
        </h1>
        <p className="text-xs text-halloween-muted mt-1">
          Apertura/cierre de votación, cupos y generador de carteles con código QR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border space-y-6">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {savedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuración guardada exitosamente en el servidor.</span>
              </div>
            )}

            {/* Voting Switch */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Estado del Periodo de Votación
              </label>
              <select
                value={votingStatus}
                onChange={(e) => setVotingStatus(e.target.value)}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white text-xs font-semibold focus:outline-none focus:border-halloween-purple disabled:opacity-50"
              >
                <option value="open">🟢 Abierta (Permite emitir votos a usuarios identificados)</option>
                <option value="paused">🟡 Pausada (Votación suspendida temporalmente)</option>
                <option value="closed">🔴 Cerrada (Votación finalizada para cómputo de resultados)</option>
                <option value="upcoming">⏳ Próxima (Previo a la apertura oficial)</option>
              </select>
            </div>

            {/* Live Stage Public Visibility */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Escenario en Vivo (Pasarela Sincrónica 3 de Noviembre)
              </label>
              <select
                value={isLiveActive ? 'active' : 'inactive'}
                onChange={(e) => setIsLiveActive(e.target.value === 'active')}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white text-xs font-semibold focus:outline-none focus:border-halloween-purple disabled:opacity-50"
              >
                <option value="inactive">🔴 Inactivo (Oculto al público hasta el 3 de noviembre)</option>
                <option value="active">🟢 Activo (Visible en barra de navegación y habilitado para el público)</option>
              </select>
              <span className="text-[11px] text-halloween-muted mt-1 block">
                Solo debe activarse el día oficial del evento (3 de noviembre de 2026) cuando comience la pasarela en el auditorio.
              </span>
            </div>

            {/* Capacity Limit */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Límite de Capacidad de Participantes
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={regLimit}
                onChange={(e) => setRegLimit(Number(e.target.value))}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white font-mono text-xs disabled:opacity-50"
              />
              <span className="text-[11px] text-halloween-muted mt-1 block">
                Objetivo institucional: 100 participantes ({totalRegistered} registros activos actualmente).
              </span>
            </div>

            {admin?.role === 'admin' && (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark shadow-glow-purple flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros del Concurso</span>
              </button>
            )}
          </form>
        </div>

        {/* QR Code Poster Generator Personalizado */}
        <div className="glass-card rounded-3xl p-6 border border-halloween-purple/40 text-center space-y-4 shadow-glow-purple">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Código QR Personalizado con Logo
            </h3>
            <p className="text-xs text-halloween-muted mt-1">
              Con logotipo de calabaza geométrica y alta tolerancia a errores. Ideal para mamparas, gafetes y proyección.
            </p>
          </div>

          <CustomQrWithLogo
            size={260}
            showLogo={true}
            logoSrc="/logos/concurso-fmvz-square.jpg"
            showActions={true}
          />
        </div>
      </div>

      {/* Resguardo y Copia de Seguridad */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 bg-emerald-950/15 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Resguardo Oficial y Copia de Seguridad</span>
            </div>
            <h2 className="font-display font-black text-xl text-white">
              Copia de Seguridad Integral (Fotografías + Datos + Votos)
            </h2>
            <p className="text-xs text-halloween-lavender max-w-2xl leading-relaxed">
              Descarga un archivo snapshot en formato JSON con la totalidad de participantes inscritos, sus fotografías originales en alta definición, las cédulas de votación, los folios de auditoría y los ajustes del certamen. Guárdalo directamente en Google Drive o en una memoria USB institucional.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="px-6 py-4 rounded-2xl font-display font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-400/50 disabled:opacity-50 whitespace-nowrap transform hover:-translate-y-0.5 active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>{downloadingBackup ? 'Generando Respaldo...' : 'Descargar Respaldo Completo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
