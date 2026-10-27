import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Heart, Shield, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useContest } from '../context/ContestContext';

export const VoteIdentify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const { voterIdentity, setVoterIdentity, isVotingOpen, isLiveActive } = useContest();

  const [voterType, setVoterType] = useState<'student' | 'worker'>('student');
  const [fullName, setFullName] = useState(voterIdentity?.full_name || '');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }

    const cleanId = identifier.replace(/\s+/g, '');
    if (voterType === 'student' && !/^\d{9}$/.test(cleanId)) {
      setError('El número de cuenta de estudiante debe tener exactamente 9 dígitos');
      return;
    }
    if (voterType === 'worker' && !/^\d{6}$/.test(cleanId)) {
      setError('El identificador de trabajador debe tener exactamente 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/vote/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          voter_type: voterType,
          institutional_identifier: cleanId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'No fue posible validar tu identidad');
      }

      // Save valid identity in session
      setVoterIdentity({
        full_name: fullName.trim(),
        voter_type: voterType,
        institutional_identifier: cleanId,
        institutional_identifier_masked: data.voter.institutional_identifier_masked,
      });

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/participantes');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el sistema de votación');
    } finally {
      setLoading(false);
    }
  };

  if (!isVotingOpen) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center safe-bottom">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-halloween-white">
          Votación Cerrada
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-2">
          El periodo de votación pública del Segundo Concurso de Disfraces se encuentra cerrado o en pausa.
        </p>
        <Link
          to="/participantes"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-surface-raised hover:bg-surface-subtle"
        >
          <span>Ver la galería de disfraces</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 safe-bottom">
      {/* Live Stage Banner */}
      {isLiveActive && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-purple-950/40 to-red-950/40 border border-red-500/40 text-center space-y-2 shadow-glow-purple">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600/30 text-red-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span>● MODO ESCENARIO EN VIVO</span>
          </div>
          <p className="text-xs text-white font-medium">
            ¿Estás presente en el auditorio de la FMVZ? Participa en la votación sincronizada con la pasarela.
          </p>
          <Link
            to="/votar/en-vivo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-halloween-orange hover:bg-halloween-orange-dark text-white font-bold text-xs shadow-glow-orange transition-all"
          >
            <span>Entrar a Votación en Vivo Sincronizada ➔</span>
          </Link>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-halloween-orange/20 text-halloween-orange flex items-center justify-center mx-auto mb-3 shadow-glow-orange">
          <Heart className="w-6 h-6 fill-halloween-orange" />
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-halloween-white">
          Identificación de Votante
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-1 max-w-sm mx-auto">
          Para garantizar la equidad del concurso, cada miembro de la comunidad FMVZ cuenta con un único voto.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border/90 shadow-card">
        {/* If already identified in session */}
        {voterIdentity && (
          <div className="mb-6 p-4 rounded-2xl bg-halloween-purple/15 border border-halloween-purple/30 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-halloween-lavender font-bold block">Identidad activa en sesión:</span>
              <strong className="text-white text-sm">{voterIdentity.full_name}</strong>
              <span className="text-gray-400 block mt-0.5">
                {voterIdentity.voter_type === 'student' ? 'Estudiante' : 'Trabajador'} ({voterIdentity.institutional_identifier_masked || '••••••'})
              </span>
            </div>
            <Link
              to={returnTo || '/participantes'}
              className="px-3 py-1.5 rounded-xl bg-halloween-orange text-white text-xs font-bold shadow-glow-orange"
            >
              Continuar a galería ➔
            </Link>
          </div>
        )}

        <form onSubmit={handleIdentify} className="space-y-5">
          {/* Segmented type selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Pertenencia a la comunidad
            </label>
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-raised border border-halloween-border">
              <button
                type="button"
                onClick={() => { setVoterType('student'); setError(null); }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  voterType === 'student'
                    ? 'bg-halloween-orange text-white shadow-glow-orange'
                    : 'text-halloween-muted hover:text-white'
                }`}
              >
                🎓 Estudiante
              </button>
              <button
                type="button"
                onClick={() => { setVoterType('worker'); setError(null); }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  voterType === 'worker'
                    ? 'bg-halloween-orange text-white shadow-glow-orange'
                    : 'text-halloween-muted hover:text-white'
                }`}
              >
                💼 Trabajador
              </button>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ingresa tu nombre y apellidos"
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-orange"
            />
          </div>

          {/* Identifier */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {voterType === 'student' ? 'Número de cuenta UNAM (9 dígitos)' : 'Identificador de trabajador (6 dígitos)'}
            </label>
            <input
              type="text"
              maxLength={voterType === 'student' ? 9 : 6}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
              placeholder={voterType === 'student' ? '123456789' : '123456'}
              className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm font-mono text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-orange"
            />
            <span className="text-[11px] text-halloween-muted mt-1 block">
              Se utiliza exclusivamente para verificar que no exista un voto duplicado.
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Verificando elegibilidad...</span>
            ) : (
              <>
                <span>Validar y explorar disfraces</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-halloween-border/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-[11px] text-halloween-muted">
            <Shield className="w-3.5 h-3.5 text-halloween-purple" />
            <span>Un voto por identidad normalizada registrada.</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Aviso: Este registro es un mecanismo de control de voto único y no constituye un sistema de autenticación institucional UNAM.
          </p>
        </div>
      </div>
    </div>
  );
};
