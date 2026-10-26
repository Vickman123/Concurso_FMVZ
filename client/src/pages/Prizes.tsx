import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Gift, Sparkles, Info, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { PrizeCategory } from '../types';

export const Prizes: React.FC = () => {
  const { settings } = useContest();
  const [prizes, setPrizes] = useState<PrizeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicResults, setPublicResults] = useState<any[] | null>(null);

  useEffect(() => {
    fetch('/api/contest/prizes')
      .then(res => res.json())
      .then(data => {
        if (data.prizes) setPrizes(data.prizes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/contest/results')
      .then(res => res.json())
      .then(data => {
        if (data.published && data.results) {
          setPublicResults(data.results);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 safe-bottom">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Premiación Oficial 2026</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-halloween-white">
          Premios del Concurso
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-2 max-w-lg mx-auto">
          Reconocimiento a la originalidad, destreza y trabajo artístico de nuestra comunidad FMVZ.
        </p>
      </div>

      {/* Main Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1st Place */}
        <div className="relative glass-card rounded-3xl p-6 sm:p-8 border-2 border-amber-500/50 flex flex-col justify-between shadow-glow-orange md:order-2 md:-translate-y-3">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-halloween-orange text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-md">
            1er Lugar
          </div>

          <div className="text-center pt-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-white">
              Primer Lugar General
            </h3>
            <div className="my-4">
              <span className="font-display font-black text-4xl text-amber-300">$10,000</span>
              <span className="text-xs text-gray-400 block font-semibold">MXN en efectivo</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Otorgado al participante con mayor número de votos válidos emitidos por la comunidad universitaria.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-halloween-border/50 text-center">
            <span className="text-[11px] text-amber-400 font-semibold">
              Votación de la comunidad UNAM
            </span>
          </div>
        </div>

        {/* 2nd Place */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-400/40 flex flex-col justify-between md:order-1">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-400/30">
              <span className="text-2xl">🥈</span>
            </div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              2do Lugar
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Segundo Lugar
            </h3>
            <div className="my-3">
              <span className="font-display font-black text-3xl text-slate-200">$7,000</span>
              <span className="text-xs text-gray-400 block font-semibold">MXN en efectivo</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Otorgado al segundo participante con mayor votación verificada en el portal.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-halloween-border/50 text-center">
            <span className="text-[11px] text-slate-400 font-semibold">
              Votación de la comunidad UNAM
            </span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-700/40 flex flex-col justify-between md:order-3">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-amber-700/20 text-amber-300 flex items-center justify-center mx-auto mb-4 border border-amber-700/30">
              <span className="text-2xl">🥉</span>
            </div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              3er Lugar
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Tercer Lugar
            </h3>
            <div className="my-3">
              <span className="font-display font-black text-3xl text-amber-200">$6,000</span>
              <span className="text-xs text-gray-400 block font-semibold">MXN en efectivo</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Otorgado al tercer participante con mayor votación verificada en el portal.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-halloween-border/50 text-center">
            <span className="text-[11px] text-amber-300 font-semibold">
              Votación de la comunidad UNAM
            </span>
          </div>
        </div>
      </div>

      {/* 20 Additional Prizes Feature Block */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-purple/50 shadow-glow-purple mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-halloween-purple/30 text-halloween-lavender flex items-center justify-center flex-shrink-0 border border-halloween-purple/50">
              <Gift className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-halloween-orange uppercase tracking-wider">
                Bolsa Especial FMVZ
              </span>
              <h2 className="font-display font-extrabold text-2xl text-halloween-white">
                20 Premios Adicionales
              </h2>
              <div className="text-base sm:text-lg font-bold text-halloween-lavender">
                $5,000 MXN cada uno <span className="text-xs text-gray-400">(Total: $100,000 MXN)</span>
              </div>
            </div>
          </div>

          <div className="max-w-md p-4 rounded-2xl bg-surface-raised border border-halloween-border text-xs text-gray-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-halloween-white">
              <Info className="w-4 h-4 text-halloween-orange flex-shrink-0" />
              <span>Modalidad de asignación</span>
            </div>
            <p className="leading-relaxed">
              {settings?.additional_prizes_method ||
                'Modalidad por definir en las bases oficiales del evento. No corresponde a asignación automática a los siguientes 20 lugares de la tabla.'}
            </p>
            <span className="text-[11px] text-halloween-muted block">
              Sujeto a las determinaciones del jurado calificador y comisiones del concurso.
            </span>
          </div>
        </div>
      </div>

      {/* Published Official Results (if released by admin) */}
      {publicResults && publicResults.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/50 mb-10">
          <div className="text-center mb-6">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Oficial
            </span>
            <h2 className="font-display font-black text-2xl text-white mt-1">
              Resultados Validados del Concurso
            </h2>
          </div>

          <div className="space-y-3">
            {publicResults.slice(0, 10).map((r, idx) => (
              <div
                key={r.contest_number}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-halloween-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-halloween-purple text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}º
                  </div>
                  <img src={r.photo_original_key} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <strong className="text-sm text-white block">{r.costume_title}</strong>
                    <span className="text-xs text-halloween-muted">#{String(r.contest_number).padStart(2, '0')} · {r.public_display_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-base text-halloween-orange">{r.total_votes}</span>
                  <span className="text-[10px] text-gray-400 block">votos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center">
        <Link
          to="/participantes"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white bg-halloween-orange hover:bg-halloween-orange-dark shadow-glow-orange transition-all"
        >
          <span>Explorar participantes para votar</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
