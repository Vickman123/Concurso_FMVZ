import React from 'react';
import { Shield, Lock, FileCheck, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyNotice: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 safe-bottom">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </Link>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-halloween-border/90 shadow-card space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-halloween-purple/20 text-halloween-lavender text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-halloween-orange" />
            <span>Marco Institucional UNAM</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-halloween-white">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-xs sm:text-sm text-halloween-muted mt-2">
            Segundo Concurso de Disfraces FMVZ — 3 de noviembre de 2026
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display font-bold text-base text-halloween-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-halloween-orange" />
              1. Responsable del Tratamiento de Datos Personales
            </h2>
            <p>
              La <strong>Universidad Nacional Autónoma de México (UNAM)</strong>, a través de la <strong>Facultad de Medicina Veterinaria y Zootecnia (FMVZ)</strong>, con domicilio en Circuito Exterior s/n, Ciudad Universitaria, C.P. 04510, Alcaldía Coyoacán, Ciudad de México, es la entidad responsable del uso y protección de los datos personales recabados con motivo de la organización y operación del <em>Segundo Concurso de Disfraces FMVZ</em>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-base text-halloween-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-halloween-orange" />
              2. Datos Personales Recabados
            </h2>
            <p>Para las finalidades previstas en la presente convocatoria, se recaban las siguientes categorías de datos:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
              <li><strong>Para participantes:</strong> Nombre completo, número de cuenta universitario (9 dígitos) o número de nómina/identificador de trabajador (6 dígitos), nombre público elegido, título y descripción del disfraz, y fotografía personal caracterizada.</li>
              <li><strong>Para votantes:</strong> Nombre completo, tipo de miembro de la comunidad (estudiante o trabajador) y número de identificación institucional normalizado.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-base text-halloween-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-halloween-orange" />
              3. Finalidades del Tratamiento
            </h2>
            <p>Los datos personales serán tratados para las siguientes finalidades primarias y necesarias:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
              <li>Verificar la pertenencia a la comunidad académica o laboral de la FMVZ UNAM.</li>
              <li>Asignar folios únicos y números permanentes de participación en el certamen.</li>
              <li>Garantizar la regla de <strong>un solo voto por identidad declarada</strong> mediante algoritmos de normalización y transacciones seguras.</li>
              <li>Publicar en la galería oficial las fotografías y nombres públicos que hayan sido expresamente aprobados por el comité organizador.</li>
              <li>Generar reportes estadísticos agregados y auditoría de resultados sin revelar identidades privadas.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-base text-halloween-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-halloween-orange" />
              4. Medidas de Seguridad y Protección de la Privacidad
            </h2>
            <p>
              La plataforma implementa estrictos controles de seguridad tecnológica y organizativa:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-gray-300">
              <li><strong>No exposición pública:</strong> El número de cuenta, número de trabajador y nombres completos reales de los concursantes jamás se divulgan en la galería pública ni en las respuestas de la API abierta.</li>
              <li><strong>Mecanismo de consulta seguro:</strong> La revisión del estado de registro requiere de forma simultánea el folio oficial y el identificador personal, impidiendo la visualización por parte de terceros no autorizados.</li>
              <li><strong>Cifrado y Parametrización:</strong> La persistencia en base de datos PostgreSQL utiliza consultas parametrizadas contra inyecciones SQL, control de sesiones cifradas y protección contra ataques automatizados.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display font-bold text-base text-halloween-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-halloween-orange" />
              5. Ejercicio de Derechos ARCO
            </h2>
            <p>
              Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones de su uso (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros cuando considere que no está siendo utilizada conforme a los principios legales (Cancelación); así como oponerse al uso de sus datos para fines específicos (Oposición).
            </p>
            <p>
              Para ejercer cualquiera de sus derechos ARCO, puede dirigir su solicitud a la Unidad de Transparencia de la UNAM o contactar directamente al comité del evento en: <a href="mailto:concurso.disfraces@fmvz.unam.mx" className="text-halloween-orange underline">concurso.disfraces@fmvz.unam.mx</a>.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-halloween-border/50 text-center">
          <Link
            to="/participantes"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-halloween-purple hover:bg-halloween-purple-dark"
          >
            <span>Continuar al concurso</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
