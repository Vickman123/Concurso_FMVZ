import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  q: string;
  a: string;
}

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: '¿Quién puede participar?',
      a: 'El concurso está abierto a toda la comunidad de la Facultad de Medicina Veterinaria y Zootecnia de la UNAM: estudiantes con número de cuenta activo de 9 dígitos y trabajadores académicos o administrativos con número de nómina/identificador de 6 dígitos. La capacidad máxima del certamen es de 100 participantes.',
    },
    {
      q: '¿Cómo registro mi disfraz?',
      a: 'Ingresa a la sección "Registrar mi disfraz" antes de la fecha límite. Completa el formulario de 4 pasos con tus datos personales, concepto del disfraz y sube una fotografía nítida. Una vez enviado, el sistema generará tu número oficial y folio único de registro.',
    },
    {
      q: '¿Qué fotografía debo subir?',
      a: 'Debes subir una fotografía de alta resolución (máximo 10 MB en formato JPG, PNG o WebP) que muestre a la persona real caracterizada. Importante: Siguiendo las reglas de la FMVZ, los participantes son personas humanas disfrazadas (Catrina, vampiro, monstruo, bruja, etc.). No se aceptan mascotas, perros ni gatos disfrazados.',
    },
    {
      q: '¿Cómo consulto el estado de mi registro?',
      a: 'Puedes ingresar a la sección "Consultar estado" en cualquier momento proporcionando tu folio único de registro (ej. FMVZ-REG-2026-XXXX) y tu identificador institucional. Ahí verás si tu fotografía ya fue aprobada, si requiere ajustes o si sigue en revisión.',
    },
    {
      q: '¿Cómo voto?',
      a: 'El 3 de noviembre de 2026, día oficial del concurso, ingresa a "Votar". Identifícate con tu nombre completo y número de cuenta o nómina. Explora los disfraces aprobados en la galería, selecciona tu favorito y confirma tu voto. Recibirás un comprobante digital con folio único.',
    },
    {
      q: '¿Puedo votar más de una vez?',
      a: 'No. El sistema cuenta con integridad transaccional estricta en base de datos PostgreSQL que restringe la emisión a exactamente un voto por identidad normalizada registrada. Intentos simultáneos o posteriores de votación serán rechazados automáticamente.',
    },
    {
      q: '¿Qué ocurre si mi identificador ya fue utilizado?',
      a: 'Si al ingresar tus datos el sistema indica que tu identificador ya emitió un voto y tú no lo realizaste, acude inmediatamente a la mesa de soporte del comité organizador instalada en las instalaciones de la FMVZ con tu credencial UNAM vigente para asistencia técnica.',
    },
    {
      q: '¿Cuándo se publican los resultados?',
      a: 'Los resultados oficiales se darán a conocer tras el cierre de votación el mismo 3 de noviembre de 2026, una vez que el comité organizador valide la integridad del conteo y proceda a su publicación en este portal.',
    },
    {
      q: '¿Cómo se asignan los premios adicionales?',
      a: 'Existen 20 premios adicionales de $5,000 MXN cada uno. La modalidad de asignación (menciones honoríficas, sorteo entre participantes o criterios técnicos del jurado) será determinada formalmente en las bases oficiales publicadas por la FMVZ y configurada por el comité organizador.',
    },
    {
      q: '¿Dónde puedo solicitar ayuda?',
      a: 'Para dudas técnicas sobre la plataforma, corrección de fotografías o aclaraciones, puedes comunicarte al correo oficial del comité: concurso.disfraces@fmvz.unam.mx o acudir a la mesa directiva del evento durante la jornada.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 safe-bottom">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-halloween-purple/20 text-halloween-lavender text-xs font-semibold mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-halloween-orange" />
          <span>Centro de Ayuda</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-halloween-white">
          Preguntas Frecuentes
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-2 max-w-md mx-auto">
          Encuentra respuesta a las dudas más comunes sobre las reglas, el registro y la votación del concurso.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-halloween-border/90 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-surface-raised transition-colors"
              >
                <span className="font-display font-bold text-sm sm:text-base text-halloween-white">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-halloween-orange flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-halloween-border/40 pt-3 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Box */}
      <div className="mt-12 glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-raised text-halloween-lavender flex items-center justify-center mx-auto border border-halloween-border">
          <Mail className="w-6 h-6 text-halloween-orange" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-halloween-white">
            ¿Tienes alguna otra duda o consulta especial?
          </h3>
          <p className="text-xs text-halloween-muted mt-1 max-w-sm mx-auto">
            El comité organizador del Segundo Concurso de Disfraces está para orientarte.
          </p>
        </div>
        <a
          href="mailto:concurso.disfraces@fmvz.unam.mx"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark transition-all"
        >
          <span>Contactar a concurso.disfraces@fmvz.unam.mx</span>
        </a>
      </div>
    </div>
  );
};
