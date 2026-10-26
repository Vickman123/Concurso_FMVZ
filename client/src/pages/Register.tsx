import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Camera,
  Shield,
  FileText,
  Sparkles
} from 'lucide-react';
import { GlowingPumpkin } from '../components/HalloweenDecorations';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [participantType, setParticipantType] = useState<'student' | 'worker'>('student');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [costumeTitle, setCostumeTitle] = useState('');
  const [publicDisplayName, setPublicDisplayName] = useState('');
  const [description, setDescription] = useState('');

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Agreements
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreePublish, setAgreePublish] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    contest_number: number;
    registration_folio: string;
    message: string;
  } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate size
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La fotografía no debe superar 10 MB' }));
        return;
      }

      // Validate type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Formato no válido. Usa JPG, PNG o WebP' }));
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors(prev => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!fullName.trim() || fullName.trim().length < 3) {
        newErrors.fullName = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
      }
      const cleanId = identifier.replace(/\s+/g, '');
      if (participantType === 'student') {
        if (!/^\d{9}$/.test(cleanId)) {
          newErrors.identifier = 'El número de cuenta de estudiante debe tener exactamente 9 dígitos';
        }
      } else {
        if (!/^\d{6}$/.test(cleanId)) {
          newErrors.identifier = 'El identificador de trabajador debe tener exactamente 6 dígitos';
        }
      }
    }

    if (step === 2) {
      if (!costumeTitle.trim() || costumeTitle.trim().length < 2) {
        newErrors.costumeTitle = 'Ingresa el nombre o concepto de tu disfraz';
      }
      if (!publicDisplayName.trim() || publicDisplayName.trim().length < 2) {
        newErrors.publicDisplayName = 'Ingresa el nombre con el que aparecerás en la galería';
      }
    }

    if (step === 3) {
      if (!photoFile) {
        newErrors.photo = 'Es obligatorio subir una fotografía de tu disfraz para concursar';
      }
    }

    if (step === 4) {
      if (!agreePrivacy) {
        newErrors.agreePrivacy = 'Debes aceptar el aviso de privacidad';
      }
      if (!agreePublish) {
        newErrors.agreePublish = 'Debes autorizar la publicación de la fotografía durante el concurso';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('participant_type', participantType);
      formData.append('institutional_identifier', identifier.replace(/\s+/g, ''));
      formData.append('costume_title', costumeTitle.trim());
      formData.append('public_display_name', publicDisplayName.trim());
      formData.append('description', description.trim());
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await fetch('/api/participants/register', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el registro');
      }

      setSubmitSuccess({
        contest_number: data.contest_number,
        registration_folio: data.registration_folio,
        message: data.message,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 safe-bottom">
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-halloween-purple/50 text-center space-y-6 shadow-glow-purple">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-halloween-orange uppercase tracking-widest">
              ¡Registro Recibido con Éxito!
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-halloween-white mt-1">
              Disfraz #{String(submitSuccess.contest_number).padStart(2, '0')}
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              {costumeTitle} · <span className="text-halloween-lavender">{publicDisplayName}</span>
            </p>
          </div>

          {/* Folio Box */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border space-y-1">
            <span className="text-xs text-gray-400 font-medium">Tu Folio Único de Registro</span>
            <div className="font-mono font-bold text-base sm:text-lg text-halloween-lavender select-all">
              {submitSuccess.registration_folio}
            </div>
            <p className="text-[11px] text-halloween-muted">
              Guarda este folio para consultar el estado de tu registro.
            </p>
          </div>

          {/* Note about approval */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left leading-relaxed">
            <strong className="block font-semibold mb-0.5">⚠️ Revisión requerida:</strong>
            Para garantizar un concurso seguro y respetuoso, el comité organizador validará la fotografía antes de publicarla en la galería pública.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/registro/estado"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-halloween-white bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors text-center"
            >
              Consultar estado
            </Link>
            <Link
              to="/participantes"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-halloween-orange hover:bg-halloween-orange-dark transition-colors text-center"
            >
              Ir a la galería
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 safe-bottom">
      {/* Top Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-halloween-purple/20 text-halloween-lavender text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-halloween-orange" />
          <span>Convocatoria Abierta 2026</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-4xl text-halloween-white">
          Registrar mi disfraz
        </h1>
        <p className="text-xs sm:text-sm text-halloween-muted mt-1 max-w-md mx-auto">
          Participa con tu propuesta de disfraz original. Abierto a estudiantes y trabajadores de la FMVZ UNAM.
        </p>
      </div>

      {/* 4-Step Progress Indicator (Screen 4 mockup) */}
      <div className="flex items-center justify-between max-w-xs mx-auto mb-8 relative">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-halloween-border -z-0" />
        {[1, 2, 3, 4].map((stepNum) => (
          <div
            key={stepNum}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs transition-all ${
              currentStep === stepNum
                ? 'bg-halloween-purple text-white shadow-glow-purple scale-110 ring-4 ring-halloween-purple/30'
                : currentStep > stepNum
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-raised text-halloween-muted border border-halloween-border'
            }`}
          >
            {currentStep > stepNum ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
          </div>
        ))}
      </div>

      {/* Main Form Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border/90 shadow-card">
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ================= STEP 1: DATOS PARTICIPANTE ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-display font-bold text-lg text-halloween-white">
                Paso 1: Datos del participante
              </h2>
              <p className="text-xs text-halloween-muted">
                Tu información se usará para verificar que perteneces a la FMVZ.
              </p>
            </div>

            {/* Segmented Pill: Estudiante / Trabajador */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Tipo de participante
              </label>
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-raised border border-halloween-border">
                <button
                  type="button"
                  onClick={() => {
                    setParticipantType('student');
                    setErrors({});
                  }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    participantType === 'student'
                      ? 'bg-halloween-purple text-white shadow-glow-purple'
                      : 'text-halloween-muted hover:text-white'
                  }`}
                >
                  🎓 Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParticipantType('worker');
                    setErrors({});
                  }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    participantType === 'worker'
                      ? 'bg-halloween-purple text-white shadow-glow-purple'
                      : 'text-halloween-muted hover:text-white'
                  }`}
                >
                  💼 Trabajador
                </button>
              </div>
            </div>

            {/* Nombre completo */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre completo (Privado)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellidos"
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple focus:ring-1 focus:ring-halloween-purple"
              />
              {errors.fullName && (
                <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Identificador institucional */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {participantType === 'student' ? 'Número de cuenta UNAM (9 dígitos)' : 'Identificador de trabajador (6 dígitos)'}
              </label>
              <input
                type="text"
                maxLength={participantType === 'student' ? 9 : 6}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                placeholder={participantType === 'student' ? '123456789' : '123456'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm font-mono text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple focus:ring-1 focus:ring-halloween-purple"
              />
              <span className="text-[11px] text-halloween-muted mt-1 block">
                {participantType === 'student' ? 'Exactamente 9 dígitos numéricos' : 'Exactamente 6 dígitos numéricos'}
              </span>
              {errors.identifier && (
                <p className="text-xs text-red-400 mt-1">{errors.identifier}</p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: INFO DISFRAZ ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-display font-bold text-lg text-halloween-white">
                Paso 2: Información del disfraz
              </h2>
              <p className="text-xs text-halloween-muted">
                Describe tu propuesta creativa para la galería oficial.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre de tu disfraz
              </label>
              <input
                type="text"
                value={costumeTitle}
                onChange={(e) => setCostumeTitle(e.target.value)}
                placeholder="Ej. Catrina Universitaria, Frankenvet, etc."
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
              />
              {errors.costumeTitle && (
                <p className="text-xs text-red-400 mt-1">{errors.costumeTitle}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre público que aparecerá en la galería
              </label>
              <input
                type="text"
                value={publicDisplayName}
                onChange={(e) => setPublicDisplayName(e.target.value)}
                placeholder="Ej. Mariana H., Carlos M."
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
              />
              <span className="text-[11px] text-halloween-muted mt-1 block">
                Para proteger tu privacidad, no se recomienda usar apellidos completos.
              </span>
              {errors.publicDisplayName && (
                <p className="text-xs text-red-400 mt-1">{errors.publicDisplayName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Descripción del concepto (opcional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos sobre los materiales, inspiración y significado de tu caracterización..."
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple resize-none"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: FOTOGRAFÍA ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-display font-bold text-lg text-halloween-white">
                Paso 3: Fotografía del disfraz
              </h2>
              <p className="text-xs text-halloween-muted">
                Sube una imagen clara de cuerpo completo o medio cuerpo caracterizado.
              </p>
            </div>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-halloween-purple/40 hover:border-halloween-purple rounded-3xl p-6 text-center bg-surface-raised/40 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handlePhotoSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {photoPreview ? (
                <div className="space-y-4">
                  <div className="relative w-40 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-halloween-purple shadow-md">
                    <img src={photoPreview} alt="Vista previa del disfraz" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fotografía lista: {photoFile?.name}</span>
                  </div>
                  <span className="text-[11px] text-halloween-muted block">
                    Haz clic o toca para seleccionar otra imagen
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-halloween-white block">
                      Toca para subir o tomar fotografía
                    </span>
                    <span className="text-xs text-halloween-muted mt-1 block">
                      Formatos seguros: JPG, PNG o WebP (Máx. 10 MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {errors.photo && (
              <p className="text-xs text-red-400 text-center">{errors.photo}</p>
            )}

            <div className="p-3.5 rounded-2xl bg-surface-raised border border-halloween-border text-[11px] text-gray-300 leading-relaxed">
              💡 <strong>Regla del concurso:</strong> Las fotografías deben mostrar personas humanas caracterizadas. No se aceptan mascotas ni animales disfrazados.
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVISIÓN Y ENVÍO ================= */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-display font-bold text-lg text-halloween-white">
                Paso 4: Revisión y envío
              </h2>
              <p className="text-xs text-halloween-muted">
                Verifica tus datos antes de enviar tu registro oficial.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border space-y-3 text-xs">
              <div className="flex items-center gap-3">
                {photoPreview && (
                  <img src={photoPreview} alt="Thumbnail" className="w-16 h-20 rounded-xl object-cover border border-halloween-purple/40" />
                )}
                <div className="space-y-1">
                  <strong className="text-sm font-bold text-halloween-white block">{costumeTitle}</strong>
                  <span className="text-halloween-lavender font-semibold block">Nombre público: {publicDisplayName}</span>
                  <span className="text-gray-400 block">{fullName} ({participantType === 'student' ? 'Estudiante' : 'Trabajador'})</span>
                </div>
              </div>

              {description && (
                <p className="text-gray-300 pt-2 border-t border-halloween-border/40 italic">
                  "{description}"
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 rounded border-halloween-border text-halloween-purple focus:ring-halloween-purple bg-surface-raised"
                />
                <span className="text-xs text-gray-300">
                  He leído y acepto el <Link to="/aviso-de-privacidad" target="_blank" className="text-halloween-orange underline">Aviso de Privacidad</Link> aplicable al concurso.
                </span>
              </label>
              {errors.agreePrivacy && <p className="text-xs text-red-400 pl-6">{errors.agreePrivacy}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePublish}
                  onChange={(e) => setAgreePublish(e.target.checked)}
                  className="mt-0.5 rounded border-halloween-border text-halloween-purple focus:ring-halloween-purple bg-surface-raised"
                />
                <span className="text-xs text-gray-300">
                  Autorizo la publicación de mi fotografía en la galería oficial tras la debida aprobación del comité organizador.
                </span>
              </label>
              {errors.agreePublish && <p className="text-xs text-red-400 pl-6">{errors.agreePublish}</p>}
            </div>
          </div>
        )}

        {/* Buttons Controls */}
        <div className="mt-8 pt-6 border-t border-halloween-border/50 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-gray-300 bg-surface-raised hover:bg-surface-subtle border border-halloween-border flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark shadow-glow-purple flex items-center gap-2"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enviando registro...</span>
              ) : (
                <>
                  <span>Completar y enviar registro</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
