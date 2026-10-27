import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Download, Eye, Layers } from 'lucide-react';

export const LogoShowcase: React.FC = () => {
  const [selectedLogo, setSelectedLogo] = useState<'1' | '2' | '3'>('1');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const concepts = [
    {
      id: '1',
      title: 'Concepto 1: La Máscara & Luna FMVZ',
      badge: 'Recomendado',
      description: 'Luna naranja brillante con silueta de máscara veneciana/antifaz de disfraz, alas de murciélago y ojos violetas brillantes. Tipografía sólida y contemporánea.',
      image: '/logos/logo-concept-1-mascara-luna.svg',
      tagline: 'Misterioso, cinematográfico y festivo',
      strengths: ['Identificación inmediata con disfraces', 'Gran contraste sobre fondos oscuros', 'Equilibrio perfecto entre elegancia y terror']
    },
    {
      id: '2',
      title: 'Concepto 2: Jack-O\'-Lantern Geométrico',
      badge: 'Moderno / Low-Poly',
      description: 'Calabaza tallada con cortes angulares geométricos y luz violeta/naranja desde su interior. Transmite innovación visual y competencia estudiantil.',
      image: '/logos/logo-concept-2-jack-geometrico.svg',
      tagline: 'Moderno, dinámico y juvenil',
      strengths: ['Estilo contemporáneo no infantil', 'Iconografía reconocible de Halloween', 'Funciona excelente como avatar e icono de app']
    },
    {
      id: '3',
      title: 'Concepto 3: Sello Gótico Nocturno',
      badge: 'Institucional Alternativo',
      description: 'Insignia circular con luna creciente dorada, corona superior y alas de murciélago en silueta violeta plata. Remite a tradición y excelencia sin usar escudos oficiales.',
      image: '/logos/logo-concept-3-sello-gotico.svg',
      tagline: 'Elegante, ceremonial y exclusivo',
      strengths: ['Aspecto de galardón o trofeo oficial', 'Ideal para diplomas y gafetes', 'Máxima sobriedad académica']
    }
  ];

  return (
    <div className="min-h-screen bg-[#080A12] text-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8 safe-bottom">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#A7ABC0] hover:text-[#F7F4F0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF7417]" />
            <span>Volver al inicio</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B79AFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FF7417]" />
            <span>Propuestas de Identidad Visual (Sin UNAM)</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display font-black text-3xl sm:text-5xl text-[#F7F4F0] tracking-tight">
            Logotipos para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7417] to-[#FF9A24]">FMVZ Halloween</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#A7ABC0]">
            Tres direcciones de arte originales desarrolladas exclusivamente para el Segundo Concurso de Disfraces 2026, sin utilizar siglas ni elementos institucionales de la UNAM.
          </p>
        </div>

        {/* Presentation Graphic Sheet Card */}
        <div className="rounded-3xl bg-[#15182A] border border-[#282B47] overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-[#282B47] flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#F7F4F0]">
              <Layers className="w-4 h-4 text-[#FF7417]" />
              <span>Lámina de Conceptos de Marca (Brand Showcase)</span>
            </div>
            <a
              href="/logos/fmvz_halloween_logo_proposals.jpg"
              download="fmvz_halloween_logo_proposals.jpg"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1F38] hover:bg-[#8B5CF6]/20 text-xs font-semibold text-[#B79AFF] border border-[#282B47] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar lámina</span>
            </a>
          </div>
          <div className="p-2 sm:p-4 bg-[#080A12]/80 flex justify-center">
            <img
              src="/logos/fmvz_halloween_logo_proposals.jpg"
              alt="Lámina de presentación de logotipos FMVZ Halloween 2026"
              className="w-full max-w-4xl rounded-2xl shadow-lg border border-[#282B47]/60"
            />
          </div>
        </div>

        {/* Interactive 3-Card Concept Showcase */}
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F7F4F0] mb-6">
            Comparativa Detallada de Vectores
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {concepts.map((concept) => {
              const isSelected = selectedLogo === concept.id;
              return (
                <div
                  key={concept.id}
                  onClick={() => setSelectedLogo(concept.id as any)}
                  className={`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#1C1F38] to-[#15182A] border-[#FF7417] shadow-[0_0_30px_rgba(255,116,23,0.25)]'
                      : 'bg-[#15182A] border-[#282B47] hover:border-[#8B5CF6]/50'
                  }`}
                >
                  <div>
                    {/* Header Pill */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#8B5CF6]/20 text-[#B79AFF] border border-[#8B5CF6]/40">
                        {concept.badge}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9A24]">
                          <Check className="w-4 h-4" />
                          <span>Seleccionado</span>
                        </span>
                      )}
                    </div>

                    {/* Vector SVG Render Box */}
                    <div className="w-full aspect-[21/9] rounded-2xl bg-[#080A12] border border-[#282B47] p-3 flex items-center justify-center mb-5 overflow-hidden group">
                      <img
                        src={concept.image}
                        alt={concept.title}
                        className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <h3 className="font-display font-black text-lg text-[#F7F4F0]">
                      {concept.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#FF9A24] mt-0.5">
                      {concept.tagline}
                    </p>
                    <p className="text-xs text-[#A7ABC0] mt-3 leading-relaxed">
                      {concept.description}
                    </p>

                    {/* Strengths list */}
                    <div className="mt-4 pt-4 border-t border-[#282B47] space-y-1.5">
                      {concept.strengths.map((str, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-[#F7F4F0]">
                          <span className="text-[#FF7417] font-bold">✓</span>
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download Action */}
                  <div className="mt-6 pt-4 border-t border-[#282B47] flex items-center justify-between">
                    <a
                      href={concept.image}
                      download={`${concept.title}.svg`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B79AFF] hover:text-[#F7F4F0] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar SVG vectorial</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Mockup: How it looks inside the Header */}
        <div className="rounded-3xl bg-[#15182A] border border-[#282B47] p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-[#FF7417]" />
            <h3 className="font-display font-bold text-lg text-[#F7F4F0]">
              Simulación en la Barra de Navegación
            </h3>
          </div>
          <p className="text-xs text-[#A7ABC0] mb-6">
            Así es como luciría el encabezado del sitio con la propuesta seleccionada ({selectedLogo === '1' ? 'Concepto 1: Máscara & Luna' : selectedLogo === '2' ? 'Concepto 2: Jack-O\'-Lantern Geométrico' : 'Concepto 3: Sello Gótico'}):
          </p>

          <div className="rounded-2xl bg-[#080A12] border border-[#282B47] p-4 flex items-center justify-between">
            <div className="h-10 flex items-center">
              <img
                src={concepts.find(c => c.id === selectedLogo)?.image}
                alt="Mockup Header Logo"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs font-medium text-[#A7ABC0]">
              <span className="text-white font-bold border-b border-[#FF7417] pb-0.5">Inicio</span>
              <span>Participantes</span>
              <span>Registrar mi disfraz</span>
              <span>Premios</span>
              <span>Preguntas frecuentes</span>
            </div>

            <div className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF7417] to-[#FF9A24]">
              Votar ahora
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
