import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Lock } from 'lucide-react';
import { GlowingPumpkin } from './HalloweenDecorations';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07080F] border-t border-halloween-border/80 pt-12 pb-24 md:pb-12 text-halloween-muted text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Identity Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <GlowingPumpkin className="w-8 h-8" />
              <div>
                <h3 className="font-display font-extrabold text-base text-halloween-white tracking-wide">
                  SEGUNDO CONCURSO DE DISFRACES FMVZ
                </h3>
                <p className="text-xs text-halloween-lavender">
                  Facultad de Medicina Veterinaria y Zootecnia · UNAM
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed max-w-md text-gray-400">
              Celebrando la creatividad, el arte y el espíritu universitario de nuestra comunidad.
              Evento oficial programado para el <strong className="text-halloween-white">3 de noviembre de 2026</strong>.
            </p>
            <div className="flex items-center gap-2 text-xs text-halloween-muted">
              <Shield className="w-4 h-4 text-halloween-purple" />
              <span>Voto protegido y verificado con integridad transaccional.</span>
            </div>
          </div>

          {/* Public Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-halloween-white text-xs uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/participantes" className="hover:text-halloween-orange transition-colors">
                  Galería de disfraces
                </Link>
              </li>
              <li>
                <Link to="/registrar" className="hover:text-halloween-orange transition-colors">
                  Registro de participantes
                </Link>
              </li>
              <li>
                <Link to="/registro/estado" className="hover:text-halloween-orange transition-colors">
                  Consultar estado de registro
                </Link>
              </li>
              <li>
                <Link to="/premios" className="hover:text-halloween-orange transition-colors">
                  Premios y categorías
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes" className="hover:text-halloween-orange transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Admin */}
          <div className="space-y-3">
            <h4 className="font-semibold text-halloween-white text-xs uppercase tracking-wider">
              Institucional
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/aviso-de-privacidad" className="hover:text-halloween-lavender transition-colors flex items-center gap-1.5">
                  <span>Aviso de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes#bases" className="hover:text-halloween-lavender transition-colors">
                  Bases del concurso
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-halloween-purple/20 text-gray-300 hover:text-white border border-halloween-border transition-colors text-xs font-medium"
                >
                  <Lock className="w-3.5 h-3.5 text-halloween-purple-light" />
                  <span>Acceso Administrativo</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bottom bar */}
        <div className="pt-8 border-t border-halloween-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © 2026 FMVZ · UNAM. Concurso de Disfraces Universitario. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-halloween-orange" />
            <span>Desarrollo de Alta Concurrencia (500 VU)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
