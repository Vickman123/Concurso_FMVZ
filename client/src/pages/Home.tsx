import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Award,
  Crown,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { Participant } from '../types';
import { ParticipantCard } from '../components/ParticipantCard';
import { HeroVisual } from '../components/HeroVisual';
import { GlowingPumpkin, FloatingBat, SpookyGhost } from '../components/HalloweenDecorations';

gsap.registerPlugin(ScrollTrigger);

export const Home: React.FC = () => {
  const { settings, isVotingOpen } = useContest();
  const [featuredParticipants, setFeaturedParticipants] = useState<Participant[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'students' | 'workers'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Main page ref for GSAP scope
  const pageRef = useRef<HTMLDivElement>(null);

  // Fetch participants for preview
  useEffect(() => {
    fetch('/api/participants?limit=8')
      .then((res) => res.json())
      .then((data) => {
        if (data.participants) {
          setFeaturedParticipants(data.participants);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  // GSAP Entrance & Scroll Animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero Entrance Timeline using scoped selectors
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.from('.hero-badge', { y: 15, opacity: 0, duration: 0.45 })
        .from('.hero-title-item', { y: 25, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.2')
        .from('.hero-subtitle', { y: 15, opacity: 0, duration: 0.4 }, '-=0.25')
        .from('.hero-meta-item', { y: 15, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.2')
        .from('.hero-actions-container', { y: 15, opacity: 0, duration: 0.4 }, '-=0.15')
        .from('.hero-indicators', { y: 20, opacity: 0, duration: 0.5 }, '-=0.1');
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Filter participants
  const filteredParticipants = featuredParticipants.filter((p) => {
    if (filterType === 'students' && p.participant_type !== 'student') return false;
    if (filterType === 'workers' && p.participant_type !== 'worker') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.costume_title.toLowerCase().includes(q) ||
        p.public_display_name.toLowerCase().includes(q) ||
        String(p.contest_number).includes(q)
      );
    }
    return true;
  });

  const totalRegistered = settings?.total_registered ?? 0;
  const approvedCount = settings?.approved_count ?? 0;
  const registrationLimit = settings?.registration_limit || 100;
  const registrationPercent = Math.min(
    100,
    Math.round((totalRegistered / registrationLimit) * 100)
  );

  return (
    <div ref={pageRef} className="relative min-h-screen safe-bottom bg-[#080A12] text-[#F7F4F0] overflow-hidden">
      {/* Background Ambience Radial Lights */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-[#8B5CF6]/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-[#FF7417]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ===================== HERO SECTION (TWO COLUMNS EDITORIAL) ===================== */}
      <section
        className="relative pt-6 sm:pt-10 lg:pt-14 pb-8 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Editorial Information */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
            
            {/* Small Badge */}
            <div
              className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#15182A] border border-[#8B5CF6]/40 text-[#B79AFF] text-xs sm:text-sm font-semibold tracking-wider uppercase mb-5 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <span className="text-base">🎃</span>
              <span>SEGUNDO CONCURSO</span>
            </div>

            {/* Main Title matching reference */}
            <h1
              className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] text-[#F7F4F0]"
            >
              <span className="hero-title-item block text-[#F7F4F0]">Concurso de</span>
              <span className="hero-title-item inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF7417] via-[#FF9A24] to-[#FF7417] drop-shadow-[0_2px_12px_rgba(255,116,23,0.35)] mr-2 sm:mr-3">
                Disfraces
              </span>
              <span className="hero-title-item relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#B79AFF]">
                FMVZ
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF9A24] absolute -top-4 -right-4 rotate-12 drop-shadow" />
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="hero-subtitle mt-4 sm:mt-5 text-lg sm:text-xl text-[#B79AFF]/90 font-medium max-w-xl"
            >
              ¡Creatividad, talento y espíritu universitario!
            </p>

            {/* Date & Location Metadata */}
            <div
              className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-[#A7ABC0]"
            >
              <div className="hero-meta-item flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#15182A] border border-[#282B47]">
                <Calendar className="w-4 h-4 text-[#FF7417]" />
                <span className="font-medium text-[#F7F4F0]">3 de noviembre de 2026</span>
              </div>
              <div className="hero-meta-item flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#15182A] border border-[#282B47]">
                <MapPin className="w-4 h-4 text-[#B79AFF]" />
                <span className="font-medium text-[#F7F4F0]">Sede FMVZ</span>
              </div>
            </div>

            {/* Mobile Hero Visual Placement: displays right between metadata and CTA buttons on small screens */}
            <div className="lg:hidden w-full my-6">
              <HeroVisual />
            </div>

            {/* Action Buttons */}
            <div
              className="hero-actions-container mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
            >
              <Link
                to="/registrar"
                className="hero-action-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#FF7417] via-[#FF8526] to-[#FF9A24] hover:brightness-110 shadow-[0_4px_30px_rgba(255,116,23,0.55)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                <PlusCircle className="w-5 h-5 text-white" />
                <span>Registrar mi disfraz</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 text-[#FFF]">
                  ¡Inscríbete!
                </span>
              </Link>
              <Link
                to="/participantes"
                className="hero-action-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-base text-[#F7F4F0] bg-[#15182A] hover:bg-[#1C1F38] border border-[#282B47] hover:border-[#8B5CF6]/50 transition-all duration-200"
              >
                <span>⭐ Ver disfraces</span>
                {approvedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#282B47] text-[#FF9A24] font-bold">
                    {approvedCount}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-[#A7ABC0]" />
              </Link>
            </div>
          </div>

          {/* Right Column: Cinematic Visual Composition (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <HeroVisual />
          </div>

        </div>
      </section>

      {/* ===================== STATUS INDICATOR BAR (SECTION 5) ===================== */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-2 sm:mt-2 mb-14">
        <div
          className="hero-indicators rounded-3xl bg-[#15182A]/90 backdrop-blur-xl border border-[#282B47] p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.45)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#282B47]">
            
            {/* Block 1: Participantes registrados */}
            <div className="flex flex-col justify-center pt-2 sm:pt-0 sm:px-4 first:px-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#A7ABC0] uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[#FF7417]" />
                  <span>Participantes</span>
                </div>
                <span className="text-xs font-bold text-[#FF9A24]">
                  {registrationPercent}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-black text-2xl sm:text-3xl text-[#F7F4F0]">
                  {totalRegistered}
                </span>
                <span className="text-sm font-semibold text-[#A7ABC0]">
                  / {registrationLimit} registrados
                </span>
              </div>
              {/* Dual-color Progress Bar (Orange to Purple) */}
              <div className="w-full h-2 rounded-full bg-[#080A12] mt-3 overflow-hidden border border-[#282B47]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7417] via-[#FF9A24] to-[#8B5CF6] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,116,23,0.6)]"
                  style={{ width: `${registrationPercent}%` }}
                />
              </div>
            </div>

            {/* Block 2: Voto por persona */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A7ABC0] uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                <span>Votación justa</span>
              </div>
              <p className="font-display font-bold text-base sm:text-lg text-[#F7F4F0]">
                Una sola vez por persona
              </p>
              <p className="text-xs text-[#A7ABC0] mt-0.5">
                Tu voto cuenta y está blindado institucionalmente.
              </p>
            </div>

            {/* Block 3: Para estudiantes y trabajadores */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A7ABC0] uppercase tracking-wider mb-1.5">
                <Sparkles className="w-4 h-4 text-[#FF9A24]" />
                <span>Comunidad FMVZ</span>
              </div>
              <p className="font-display font-bold text-base sm:text-lg text-[#F7F4F0]">
                Estudiantes y trabajadores
              </p>
              <p className="text-xs text-[#A7ABC0] mt-0.5">
                Sé parte del espíritu de la comunidad FMVZ.
              </p>
            </div>

            {/* Block 4: Disfraces originales */}
            <div className="flex flex-col justify-center pt-4 sm:pt-0 sm:px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A7ABC0] uppercase tracking-wider mb-1.5">
                <Award className="w-4 h-4 text-[#B79AFF]" />
                <span>Creatividad libre</span>
              </div>
              <p className="font-display font-bold text-base sm:text-lg text-[#F7F4F0]">
                Disfraces originales
              </p>
              <p className="text-xs text-[#A7ABC0] mt-0.5">
                Muestra tu creatividad, talento y caracterización.
              </p>
            </div>

          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="flex justify-center mt-6">
          <a
            href="#galeria"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#15182A] border border-[#282B47] text-xs font-medium text-[#A7ABC0] hover:text-[#F7F4F0] hover:border-[#FF7417]/50 transition-all group"
          >
            <span>Ver participantes</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#FF7417] group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* ===================== PARTICIPANTS GALLERY PREVIEW (SECTION 7) ===================== */}
      <section id="galeria" className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#282B47]/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#B79AFF] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7417]" />
              <span>Galería de Concursantes</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#F7F4F0]">
              Disfraces Participantes
            </h2>
            <p className="text-sm text-[#A7ABC0] mt-1">
              Conoce las caracterizaciones creativas registradas por estudiantes y trabajadores.
            </p>
          </div>

          <Link
            to="/participantes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#F7F4F0] bg-[#15182A] hover:bg-[#1C1F38] border border-[#282B47] hover:border-[#FF7417]/50 transition-all self-start md:self-auto"
          >
            <span>Ver participantes {approvedCount > 0 ? `(${approvedCount})` : ''}</span>
            <ArrowRight className="w-4 h-4 text-[#FF7417]" />
          </Link>
        </div>

        {/* Interactive Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-[#FF7417] to-[#FF9A24] text-white shadow-[0_0_15px_rgba(255,116,23,0.4)]'
                  : 'bg-[#15182A] text-[#A7ABC0] hover:text-white border border-[#282B47]'
              }`}
            >
              Todos ({featuredParticipants.length})
            </button>
            <button
              onClick={() => setFilterType('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'students'
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'bg-[#15182A] text-[#A7ABC0] hover:text-white border border-[#282B47]'
              }`}
            >
              Estudiantes
            </button>
            <button
              onClick={() => setFilterType('workers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === 'workers'
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'bg-[#15182A] text-[#A7ABC0] hover:text-white border border-[#282B47]'
              }`}
            >
              Trabajadores
            </button>
          </div>

          {/* Real-time search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#A7ABC0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por disfraz o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15182A] border border-[#282B47] text-xs text-[#F7F4F0] placeholder-[#A7ABC0]/60 focus:outline-none focus:border-[#FF7417] transition-colors"
            />
          </div>
        </div>

        {/* Participants Grid */}
        {loadingFeatured ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-3xl bg-[#15182A] animate-pulse border border-[#282B47]"
              />
            ))}
          </div>
        ) : filteredParticipants.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredParticipants.map((p) => (
              <ParticipantCard
                key={p.id}
                participant={p}
                isVotingOpen={isVotingOpen}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-[#15182A] border border-[#282B47] p-12 text-center">
            <SpookyGhost className="w-12 h-12 mx-auto text-[#8B5CF6]/50 mb-3" />
            <p className="text-base font-semibold text-[#F7F4F0]">
              No se encontraron disfraces con ese criterio.
            </p>
            <p className="text-xs text-[#A7ABC0] mt-1">
              Prueba buscando otro título o cambiando el filtro seleccionado.
            </p>
          </div>
        )}

        {/* View all button CTA */}
        <div className="text-center mt-10">
          <Link
            to="/participantes"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#FF7417] to-[#FF9A24] shadow-[0_4px_25px_rgba(255,116,23,0.35)] hover:brightness-110 transition-all transform hover:-translate-y-0.5"
          >
            <span>
              Explorar galería completa {approvedCount > 0 ? `(${approvedCount} participante${approvedCount === 1 ? '' : 's'})` : ''}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===================== PARTICIPA & CÓMO VOTAR CALLOUT ===================== */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#282B47]/60">
        <div className="rounded-3xl bg-gradient-to-br from-[#15182A] via-[#1A1D36] to-[#15182A] border border-[#8B5CF6]/40 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF7417]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FF7417]/20 text-[#FF9A24] border border-[#FF7417]/40">
                Inscripciones Abiertas
              </span>
              <h3 className="font-display font-black text-2xl sm:text-4xl text-[#F7F4F0] mt-3">
                ¿Aún no has registrado tu caracterización?
              </h3>
              <p className="text-sm sm:text-base text-[#A7ABC0] mt-3 max-w-2xl leading-relaxed">
                El concurso está abierto a todos los alumnos y personal administrativo o académico de la Facultad de Medicina Veterinaria y Zootecnia (FMVZ). El cupo es de 100 participantes.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-[#F7F4F0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF7417]" />
                  <span>Alumnos: Número de cuenta (9 dígitos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Trabajadores: ID de trabajador (6 dígitos)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/registrar"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#FF7417] to-[#FF9A24] hover:brightness-110 shadow-[0_0_20px_rgba(255,116,23,0.4)] transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar mi disfraz ahora</span>
              </Link>
              <Link
                to="/preguntas-frecuentes"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm text-[#F7F4F0] bg-[#15182A] hover:bg-[#1C1F38] border border-[#282B47] transition-colors"
              >
                <span>Preguntas frecuentes</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
