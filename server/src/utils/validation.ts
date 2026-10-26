import { z } from 'zod';

export function normalizeIdentifier(val: string): string {
  if (!val) return '';
  return val.replace(/\s+/g, '').replace(/-/g, '').trim();
}

export const participantRegistrationSchema = z.object({
  full_name: z.string().trim().min(3, 'El nombre completo debe tener al menos 3 caracteres').max(200),
  public_display_name: z.string().trim().min(2, 'El nombre público debe tener al menos 2 caracteres').max(100),
  costume_title: z.string().trim().min(2, 'El nombre del disfraz debe tener al menos 2 caracteres').max(100),
  description: z.string().trim().max(1000).optional().default(''),
  participant_type: z.enum(['student', 'worker'], {
    errorMap: () => ({ message: 'Selecciona si eres Estudiante o Trabajador' })
  }),
  institutional_identifier: z.string().trim()
}).refine((data) => {
  const normalized = normalizeIdentifier(data.institutional_identifier);
  if (data.participant_type === 'student') {
    return /^\d{9}$/.test(normalized);
  } else {
    return /^\d{6}$/.test(normalized);
  }
}, {
  message: 'El identificador institucional debe ser de exactamente 9 dígitos para Estudiantes o 6 dígitos para Trabajadores',
  path: ['institutional_identifier'],
});

export const voterIdentificationSchema = z.object({
  full_name: z.string().trim().min(3, 'Ingresa tu nombre completo').max(200),
  voter_type: z.enum(['student', 'worker'], {
    errorMap: () => ({ message: 'Selecciona si eres Estudiante o Trabajador' })
  }),
  institutional_identifier: z.string().trim()
}).refine((data) => {
  const normalized = normalizeIdentifier(data.institutional_identifier);
  if (data.voter_type === 'student') {
    return /^\d{9}$/.test(normalized);
  } else {
    return /^\d{6}$/.test(normalized);
  }
}, {
  message: 'El identificador institucional debe ser de exactamente 9 dígitos para Estudiantes o 6 dígitos para Trabajadores',
  path: ['institutional_identifier'],
});

export const voteSubmissionSchema = z.object({
  full_name: z.string().trim().min(3, 'Ingresa tu nombre completo').max(200),
  voter_type: z.enum(['student', 'worker']),
  institutional_identifier: z.string().trim(),
  participant_number: z.number().int().positive('Número de participante inválido'),
}).refine((data) => {
  const normalized = normalizeIdentifier(data.institutional_identifier);
  if (data.voter_type === 'student') {
    return /^\d{9}$/.test(normalized);
  } else {
    return /^\d{6}$/.test(normalized);
  }
}, {
  message: 'Identificador institucional inválido (9 dígitos para estudiante, 6 para trabajador)',
  path: ['institutional_identifier'],
});

export const statusCheckSchema = z.object({
  registration_folio: z.string().trim().min(5, 'Folio de registro requerido'),
  institutional_identifier: z.string().trim().min(6, 'Identificador requerido'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'Contraseña requerida'),
});
