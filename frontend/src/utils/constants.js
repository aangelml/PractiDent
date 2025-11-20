// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'practident_token';
export const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'practident_refresh_token';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  MAESTRO: 'maestro',
  PRACTICANTE: 'practicante',
  PACIENTE: 'paciente'
};

// User Types for Registration
export const USER_TYPES = [
  { value: 'practicante', label: 'Practicante' },
  { value: 'maestro', label: 'Maestro' },
  { value: 'paciente', label: 'Paciente' }
];

// Turnos para Practicantes
export const TURNOS = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' }
];

// Semestres (1-12)
export const SEMESTRES = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}° Semestre`
}));

// Estados
export const ESTADOS = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido'
};

// Dashboard Routes by Role
export const DASHBOARD_ROUTES = {
  admin: '/dashboard/admin',
  maestro: '/dashboard/maestro',
  practicante: '/dashboard/practicante',
  paciente: '/dashboard/paciente'
};

// Password Validation Regex
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Matricula Format (6-10 caracteres alfanuméricos)
export const MATRICULA_REGEX = /^[A-Z0-9]{6,10}$/;

// Cedula Format (7-8 dígitos)
export const CEDULA_REGEX = /^[0-9]{7,8}$/;

// Phone Format (10 dígitos)
export const PHONE_REGEX = /^[0-9]{10}$/;

// Messages
export const MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGIN_ERROR: 'Credenciales inválidas',
  REGISTER_SUCCESS: 'Registro exitoso',
  REGISTER_ERROR: 'Error al registrar usuario',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
  TOKEN_EXPIRED: 'Sesión expirada. Por favor, inicia sesión nuevamente',
  NETWORK_ERROR: 'Error de conexión. Por favor, intenta nuevamente',
  UNAUTHORIZED: 'No tienes permisos para acceder a este recurso'
};

// ==================== PRÁCTICAS ====================

// Estados de Prácticas
export const PRACTICE_ESTADOS = {
  ACTIVA: 'activa',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
};

export const PRACTICE_ESTADOS_OPTIONS = [
  { value: 'activa', label: 'Activa' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' }
];

// Tipos de Prácticas
export const PRACTICE_TIPOS = [
  { value: 'Profilaxis', label: 'Profilaxis' },
  { value: 'Endodoncia', label: 'Endodoncia' },
  { value: 'Periodoncia', label: 'Periodoncia' },
  { value: 'Ortodoncia', label: 'Ortodoncia' },
  { value: 'Cirugia', label: 'Cirugía' },
  { value: 'Restauracion', label: 'Restauración' },
  { value: 'Protesis', label: 'Prótesis' },
  { value: 'Pediatrica', label: 'Pediátrica' },
  { value: 'Estetica', label: 'Estética' },
  { value: 'Diagnostico', label: 'Diagnóstico' }
];

// Niveles de Dificultad
export const PRACTICE_NIVELES = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' }
];

// Estados de Asignación
export const ASSIGNMENT_ESTADOS = {
  ASIGNADO: 'asignado',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
};

export const ASSIGNMENT_ESTADOS_OPTIONS = [
  { value: 'asignado', label: 'Asignado' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' }
];

// Colores para Badges de Prácticas
export const PRACTICE_ESTADO_COLORS = {
  activa: 'success',
  completada: 'info',
  cancelada: 'error'
};

export const PRACTICE_NIVEL_COLORS = {
  basico: 'success',
  intermedio: 'warning',
  avanzado: 'error'
};

export const ASSIGNMENT_ESTADO_COLORS = {
  asignado: 'info',
  en_progreso: 'warning',
  completado: 'success',
  cancelado: 'error'
};

// ==================== CITAS ====================

// Estados de Citas
export const APPOINTMENT_ESTADOS = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio'
};

export const APPOINTMENT_ESTADOS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No Asistió' }
];

export const APPOINTMENT_DURACIONES = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 minutos' },
  { value: 120, label: '2 horas' }
];

export const HORARIO_INICIO = '08:00';
export const HORARIO_FIN = '20:00';
export const INTERVALO_MINUTOS = 30;

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo', abbr: 'Dom' },
  { value: 1, label: 'Lunes', abbr: 'Lun' },
  { value: 2, label: 'Martes', abbr: 'Mar' },
  { value: 3, label: 'Miércoles', abbr: 'Mié' },
  { value: 4, label: 'Jueves', abbr: 'Jue' },
  { value: 5, label: 'Viernes', abbr: 'Vie' },
  { value: 6, label: 'Sábado', abbr: 'Sáb' }
];

export const APPOINTMENT_ESTADO_COLORS = {
  pendiente: 'warning',
  confirmada: 'info',
  completada: 'success',
  cancelada: 'error',
  no_asistio: 'error'
};

export const MOTIVOS_CONSULTA = [
  { value: 'limpieza', label: 'Limpieza Dental' },
  { value: 'revision', label: 'Revisión General' },
  { value: 'dolor', label: 'Dolor Dental' },
  { value: 'ortodoncia', label: 'Ortodoncia' },
  { value: 'endodoncia', label: 'Endodoncia' },
  { value: 'extraccion', label: 'Extracción' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'restauracion', label: 'Restauración' },
  { value: 'protesis', label: 'Prótesis' },
  { value: 'estetica', label: 'Estética Dental' },
  { value: 'otro', label: 'Otro' }
];

export const CALIFICACIONES = [
  { value: 1, label: '⭐ Muy Malo' },
  { value: 2, label: '⭐⭐ Malo' },
  { value: 3, label: '⭐⭐⭐ Regular' },
  { value: 4, label: '⭐⭐⭐⭐ Bueno' },
  { value: 5, label: '⭐⭐⭐⭐⭐ Excelente' }
];