import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Edit2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrizeCategory } from '../../types';

export const AdminPrizes: React.FC = () => {
  const { token, admin } = useAuth();
  const [prizes, setPrizes] = useState<PrizeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState<PrizeCategory | null>(null);
  const [methodText, setMethodText] = useState('');
  const [amountVal, setAmountVal] = useState<string | number>('');

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prizes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrizes(data.prizes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, [token]);

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrize) return;

    try {
      const res = await fetch(`/api/admin/prizes/${editingPrize.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allocation_method: methodText,
          amount_mxn: Number(amountVal),
        }),
      });

      if (res.ok) {
        setEditingPrize(null);
        fetchPrizes();
      } else {
        alert('Error al actualizar premio');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
          Configuración de Premios y Asignación
        </h1>
        <p className="text-xs text-halloween-muted mt-1">
          Gestiona las categorías de premiación y la modalidad aplicable a los 20 premios adicionales de $5,000 MXN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prizes.map((p) => (
          <div
            key={p.id}
            className="glass-card rounded-3xl p-6 border border-halloween-border flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-halloween-orange uppercase tracking-wider">
                  {p.quantity > 1 ? `${p.quantity} Premios` : 'Premio Individual'}
                </span>
                {admin?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingPrize(p);
                      setMethodText(p.allocation_method);
                      setAmountVal(p.amount_mxn);
                    }}
                    className="p-1.5 rounded-lg bg-surface-raised hover:bg-halloween-purple/20 text-gray-300 hover:text-white"
                    title="Editar regla"
                  >
                    <Edit2 className="w-4 h-4 text-halloween-purple-light" />
                  </button>
                )}
              </div>

              <h3 className="font-display font-extrabold text-xl text-white">
                {p.name}
              </h3>
              <div className="font-display font-black text-2xl text-halloween-lavender">
                ${Number(p.amount_mxn).toLocaleString('es-MX')} MXN
              </div>

              <div className="pt-2 border-t border-halloween-border/50 text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-400 block mb-0.5">Modalidad de asignación:</strong>
                {p.allocation_method}
              </div>
            </div>

            <div className="text-[10px] text-halloween-muted">
              Posición ranking: {p.rank_position || 'Especial'}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-card border border-halloween-purple/40 p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-white">
              Editar: {editingPrize.name}
            </h3>

            <form onSubmit={handleSavePrize} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Monto unitario (MXN)
                </label>
                <input
                  type="number"
                  value={amountVal}
                  onChange={(e) => setAmountVal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Modalidad de asignación oficial
                </label>
                <textarea
                  rows={3}
                  value={methodText}
                  onChange={(e) => setMethodText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-white resize-none"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Esta descripción se reflejará en la sección pública de Premios.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrize(null)}
                  className="flex-1 py-2.5 rounded-xl text-gray-300 bg-surface-raised"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-halloween-purple hover:bg-halloween-purple-dark"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
