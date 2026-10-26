import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Participant } from '../types';
import { useContest } from '../context/ContestContext';

export const VoteConfirm: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const { voterIdentity, setLastVoteReceipt, isVotingOpen } = useContest();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loadingParticipant, setLoadingParticipant] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user navigated directly here without entering credentials, allow inline quick identification
  const [inlineFullName, setInlineFullName] = useState('');
  const [inlineType, setInlineType] = useState<'student' | 'worker'>('student');
  const [inlineId, setInlineId] = useState('');

  useEffect(() => {
    fetch(`/api/participants/${numero}`)
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
      .finally(() => setLoadingParticipant(false));
  }, [numero]);

  const handleConfirmVote = async () => {
    setError(null);

    // Determine credentials to use
    let name = voterIdentity?.full_name || inlineFullName.trim();
    let type = voterIdentity?.voter_type || inlineType;
    let iden = voterIdentity?.institutional_identifier || inlineId.replace(/\s+/g, '');

    if (!name || name.length < 3) {
      setError('Ingresa tu nombre completo para confirmar tu voto');
      return;
    }

    if (type === 'student' && !/^\d{9}$/.test(iden)) {
      setError('El número de cuenta de estudiante debe tener 9 dígitos');
      return;
    }
    if (type === 'worker' && !/^\d{6}$/.test(iden)) {
      setError('El identificador de trabajador debe tener 6 dígitos');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          voter_type: type,
          institutional_identifier: iden,
          participant_number: Number(numero),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el voto');
      }

      // Confetti celebration!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF7417', '#8B5CF6', '#F8F5F0', '#10B981'],
        });
      } catch (e) {
        // ignore if not supported
      }

      // Save receipt
      setLastVoteReceipt({
        confirmation_folio: data.confirmation_folio,
        voted_at: data.voted_at,
        participant: data.participant,
      });

      navigate('/voto/confirmado');
    } catch (err: any) {
      setError(err.message || 'Error al emitir el voto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingParticipant) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center safe-bottom">
        <div className="w-12 h-12 rounded-full border-4 border-halloween-orange border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  if (error && !participant) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center safe-bottom">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="font-display font-bold text-lg text-white">{error}</h2>
        <Link to="/participantes" className="mt-4 inline-block px-4 py-2 bg-surface-raised rounded-xl text-xs">
          Volver a la galería
        </Link>
      </div>
    );
  }

  const numStr = String(participant?.contest_number || numero).padStart(2, '0');

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-8 safe-bottom">
      {/* Top Bar matching Screen 3 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/participantes')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        <span className="font-display font-bold text-sm text-halloween-white">
          Votar
        </span>
        <div className="w-12" /> {/* spacer */}
      </div>

      {/* Main Confirmation Container */}
      <div className="space-y-4 animate-fadeIn">
        {/* Photo Container */}
        <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-halloween-purple/40 shadow-glow-purple bg-gradient-to-b from-[#1E1B4B] to-[#090B14]">
          <img
            src={participant?.photo_original_key}
            alt={participant?.costume_title}
            className="w-full h-full object-cover object-top"
          />

          {/* Number Badge */}
          <div className="absolute top-3 left-3">
            <div className="w-9 h-9 rounded-full bg-halloween-purple text-white font-display font-bold text-xs flex items-center justify-center border border-white/20 shadow-md">
              {numStr}
            </div>
          </div>

          {/* Sparkle icon */}
          <div className="absolute top-3 right-3 text-amber-400">
            <Sparkles className="w-5 h-5 drop-shadow" />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090B14] via-[#090B14]/80 to-transparent pointer-events-none" />
        </div>

        {/* Participant Info */}
        <div className="space-y-1 px-1">
          <h2 className="font-display font-extrabold text-2xl text-halloween-white">
            {participant?.costume_title}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-halloween-lavender font-semibold">
              {participant?.public_display_name}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">
              {participant?.participant_type === 'student' ? '🎓 Estudiante' : '💼 Trabajador'}
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
            {participant?.description || 'Tradición, ciencia y vida universitaria en un solo disfraz.'}
          </p>
        </div>

        {/* If no identity is stored in session, show inline fields */}
        {!voterIdentity && (
          <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border space-y-3">
            <span className="text-xs font-bold text-halloween-orange uppercase tracking-wider block">
              Tus datos para registrar el voto
            </span>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-card border border-halloween-border">
              <button
                type="button"
                onClick={() => setInlineType('student')}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  inlineType === 'student' ? 'bg-halloween-purple text-white' : 'text-halloween-muted'
                }`}
              >
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => setInlineType('worker')}
                className={`py-1.5 rounded-lg text-xs font-bold ${
                  inlineType === 'worker' ? 'bg-halloween-purple text-white' : 'text-halloween-muted'
                }`}
              >
                Trabajador
              </button>
            </div>
            <input
              type="text"
              value={inlineFullName}
              onChange={(e) => setInlineFullName(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-3 py-2 rounded-xl bg-surface-card border border-halloween-border text-xs text-white placeholder-halloween-muted"
            />
            <input
              type="text"
              maxLength={inlineType === 'student' ? 9 : 6}
              value={inlineId}
              onChange={(e) => setInlineId(e.target.value.replace(/\D/g, ''))}
              placeholder={inlineType === 'student' ? 'Número de cuenta (9 dígitos)' : 'Identificador (6 dígitos)'}
              className="w-full px-3 py-2 rounded-xl bg-surface-card border border-halloween-border text-xs font-mono text-white placeholder-halloween-muted"
            />
          </div>
        )}

        {/* Confirmation Card (matching screen 3) */}
        <div className="glass-card rounded-3xl p-6 border border-halloween-border text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-halloween-purple/20 text-halloween-purple-light flex items-center justify-center">
            <Heart className="w-7 h-7 fill-halloween-purple-light" />
          </div>

          <div>
            <h3 className="font-display font-extrabold text-xl text-halloween-white">
              ¿Confirmas tu voto?
            </h3>
            <p className="text-xs text-halloween-muted mt-1">
              Una sola vez por persona. Esta acción no se puede deshacer.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleConfirmVote}
              disabled={isSubmitting || !isVotingOpen}
              className="w-full py-3.5 rounded-2xl font-display font-bold text-sm text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando voto...' : 'Sí, votar por este disfraz'}
            </button>

            <button
              onClick={() => navigate('/participantes')}
              className="w-full py-3 rounded-2xl font-semibold text-xs text-gray-300 bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors"
            >
              Cancelar y volver a la galería
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
