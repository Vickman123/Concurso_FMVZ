import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Sparkles, AlertCircle, Share2, Check, Radio } from 'lucide-react';
import { Participant } from '../types';
import { useContest } from '../context/ContestContext';

export const ParticipantDetail: React.FC = () => {
  const { number } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const { isLiveActive } = useContest();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/participants/${number}`)
      .then(res => {
        if (!res.ok) throw new Error('Participante no encontrado');
        return res.json();
      })
      .then(data => {
        setParticipant(data.participant);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [number]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${participant?.costume_title} — Segundo Concurso FMVZ`,
        text: `¡Mira el disfraz de ${participant?.public_display_name} en el Concurso de Disfraces FMVZ!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 safe-bottom text-center">
        <div className="aspect-[4/5] rounded-3xl bg-surface-card animate-pulse max-w-md mx-auto" />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center safe-bottom">
        <div className="w-16 h-16 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-white">Participante no disponible</h2>
        <p className="text-xs text-halloween-muted mt-2">
          {error || 'No se pudo localizar el disfraz solicitado.'}
        </p>
        <Link
          to="/participantes"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-surface-raised text-halloween-white hover:bg-surface-subtle"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la galería</span>
        </Link>
      </div>
    );
  }

  const numStr = String(participant.contest_number).padStart(2, '0');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 safe-bottom">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/participantes')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Galería</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-halloween-lavender hover:text-white bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Enlace copiado' : 'Compartir'}</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-halloween-border/90 shadow-card">
        {/* Full Image with Dual-Layer Smart Display (No Cropping) */}
        <div className="relative w-full h-[380px] sm:h-[480px] overflow-hidden bg-[#080A12] flex items-center justify-center">
          <img
            src={participant.photo_original_key}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
          />
          <img
            src={participant.photo_original_key}
            alt={participant.costume_title}
            className="relative z-10 max-h-full max-w-full object-contain p-2 drop-shadow-2xl"
          />

          {/* Number badge */}
          <div className="absolute top-4 left-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-halloween-purple text-white font-display font-black text-sm sm:text-base flex items-center justify-center shadow-lg border-2 border-white/20">
              {numStr}
            </div>
          </div>

          {/* Participant Type Badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-black/70 backdrop-blur-md text-halloween-lavender border border-white/10">
              {participant.participant_type === 'student' ? '🎓 Estudiante FMVZ' : '💼 Trabajador FMVZ'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs font-bold text-halloween-orange uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Participante Oficial #{numStr}</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-halloween-white">
              {participant.costume_title}
            </h1>
            <p className="text-sm font-semibold text-halloween-lavender mt-1">
              {participant.public_display_name}
            </p>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-surface-raised/70 border border-halloween-border">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Concepto del disfraz
            </h3>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              {participant.description || 'Sin descripción adicional proporcionada por el participante.'}
            </p>
          </div>

          {/* Action Area: Live Voting or Gallery Mode */}
          <div className="pt-2">
            {isLiveActive ? (
              <button
                onClick={() => navigate('/en-vivo')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-display font-extrabold text-base text-white bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all animate-pulse transform hover:-translate-y-0.5 active:scale-95"
              >
                <Radio className="w-5 h-5 text-white" />
                <span>¡Pasarela en Vivo activa! Ir a votar (Kahoot)</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border text-center">
                <span className="text-xs text-halloween-lavender font-semibold block">
                  🎭 Modo Visualización y Exhibición
                </span>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  La votación se habilitará en vivo durante la pasarela en el auditorio (estilo Kahoot).
                </span>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="pt-4 border-t border-halloween-border/40 flex items-center justify-center gap-2 text-[11px] text-halloween-muted">
            <Shield className="w-3.5 h-3.5 text-halloween-purple" />
            <span>Los datos de identidad institucional se encuentran protegidos.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
