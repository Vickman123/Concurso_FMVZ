import React, { useState, useEffect } from 'react';
import { Camera, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminPhotos: React.FC = () => {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/photos/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPhotos();
  }, [token]);

  const handleModerate = async (id: number, status: 'approved' | 'needs_correction' | 'rejected') => {
    try {
      const reason = prompt(`Motivo de la decisión para marcar como ${status}:`, status === 'approved' ? 'Fotografía aprobada para galería' : 'Requiere foto de mayor calidad');
      if (reason === null) return;

      const res = await fetch(`/api/admin/participants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reason }),
      });

      if (res.ok) {
        fetchPendingPhotos();
      }
    } catch (e) {
      alert('Error al moderar fotografía');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Moderación de Fotografías
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Revisión de imágenes subidas por los participantes antes de publicarse en la galería oficial.
          </p>
        </div>
        <button
          onClick={fetchPendingPhotos}
          className="p-2 rounded-xl bg-surface-card hover:bg-surface-raised text-gray-300 hover:text-white border border-halloween-border"
          title="Actualizar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-3xl bg-surface-card animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-surface-card border border-halloween-border">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            ¡Bandeja de moderación limpia!
          </h3>
          <p className="text-xs text-halloween-muted mt-1">
            No hay fotografías pendientes de revisión en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((p) => (
            <div
              key={p.id}
              className="glass-card rounded-3xl overflow-hidden border border-halloween-border flex flex-col justify-between"
            >
              <div className="relative aspect-[4/5] bg-black">
                <img
                  src={p.photo_original_key}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-halloween-purple text-white text-xs font-bold">
                  #{String(p.contest_number).padStart(2, '0')}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'pending' ? 'bg-amber-500/90 text-white' : 'bg-orange-500/90 text-white'
                  }`}>
                    {p.status === 'pending' ? 'Pendiente' : 'Corrección'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-display font-bold text-sm text-white truncate">
                    {p.costume_title}
                  </h4>
                  <span className="text-xs text-halloween-lavender block truncate">
                    {p.public_display_name}
                  </span>
                </div>

                {/* Moderation Actions */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-halloween-border/50">
                  <button
                    onClick={() => handleModerate(p.id, 'approved')}
                    className="py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold text-[11px] flex flex-col items-center gap-1 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={() => handleModerate(p.id, 'needs_correction')}
                    className="py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white font-bold text-[11px] flex flex-col items-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Ajustar</span>
                  </button>
                  <button
                    onClick={() => handleModerate(p.id, 'rejected')}
                    className="py-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold text-[11px] flex flex-col items-center gap-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
