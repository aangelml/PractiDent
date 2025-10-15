import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Phone, Calendar, MapPin, GraduationCap, Clock, Award, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { 
  USER_TYPES, 
  TURNOS, 
  SEMESTRES, 
  PASSWORD_REGEX, 
  MATRICULA_REGEX, 
  CEDULA_REGEX, 
  PHONE_REGEX 
} from '../../utils/constants';

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('');
  const { register: registerUser, loading } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    // Eliminar confirmPassword antes de enviar
    const { confirmPassword, ...userData } = data;
    await registerUser(userData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selección de Tipo de Usuario */}
      <Select
        label="Tipo de Usuario"
        options={USER_TYPES}
        placeholder="Selecciona tu tipo de usuario"
        error={errors.tipo_usuario?.message}
        disabled={loading}
        {...register('tipo_usuario', {
          required: 'El tipo de usuario es requerido',
          onChange: (e) => setUserType(e.target.value)
        })}
      />

      {userType && (
        <>
          <Alert type="info">
            {userType === 'practicante' && 'Completa el registro con tus datos como practicante.'}
            {userType === 'maestro' && 'Completa el registro con tus datos como maestro.'}
            {userType === 'paciente' && 'Completa el registro con tus datos personales.'}
          </Alert>

          {/* Datos Básicos - Todos los usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              type="text"
              placeholder="Juan"
              icon={<User className="w-5 h-5 text-gray-400" />}
              error={errors.nombre?.message}
              disabled={loading}
              {...register('nombre', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
            />

            <Input
              label="Apellido"
              type="text"
              placeholder="Pérez"
              icon={<User className="w-5 h-5 text-gray-400" />}
              error={errors.apellido?.message}
              disabled={loading}
              {...register('apellido', {
                required: 'El apellido es requerido',
                minLength: {
                  value: 2,
                  message: 'El apellido debe tener al menos 2 caracteres'
                }
              })}
            />
          </div>

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            icon={<Mail className="w-5 h-5 text-gray-400" />}
            error={errors.email?.message}
            disabled={loading}
            {...register('email', {
              required: 'El correo electrónico es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo electrónico inválido'
              }
            })}
          />

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                error={errors.password?.message}
                helper="Mínimo 8 caracteres, mayúsculas, minúsculas, números y caracteres especiales"
                disabled={loading}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                  },
                  pattern: {
                    value: PASSWORD_REGEX,
                    message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                error={errors.confirmPassword?.message}
                disabled={loading}
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Campos específicos por tipo de usuario */}
          {userType === 'practicante' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Datos Académicos</h3>
              
              <Input
                label="Matrícula"
                type="text"
                placeholder="ABC123456"
                icon={<GraduationCap className="w-5 h-5 text-gray-400" />}
                error={errors.matricula?.message}
                helper="6-10 caracteres alfanuméricos"
                disabled={loading}
                {...register('matricula', {
                  required: 'La matrícula es requerida',
                  pattern: {
                    value: MATRICULA_REGEX,
                    message: 'Matrícula inválida (6-10 caracteres alfanuméricos)'
                  }
                })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Semestre"
                  options={SEMESTRES}
                  placeholder="Selecciona tu semestre"
                  error={errors.semestre?.message}
                  disabled={loading}
                  {...register('semestre', {
                    required: 'El semestre es requerido'
                  })}
                />

                <Select
                  label="Turno"
                  options={TURNOS}
                  placeholder="Selecciona tu turno"
                  error={errors.turno?.message}
                  disabled={loading}
                  {...register('turno', {
                    required: 'El turno es requerido'
                  })}
                />
              </div>
            </div>
          )}

          {userType === 'maestro' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Datos Profesionales</h3>
              
              <Input
                label="Cédula Profesional"
                type="text"
                placeholder="1234567"
                icon={<Award className="w-5 h-5 text-gray-400" />}
                error={errors.cedula_profesional?.message}
                helper="7-8 dígitos"
                disabled={loading}
                {...register('cedula_profesional', {
                  required: 'La cédula profesional es requerida',
                  pattern: {
                    value: CEDULA_REGEX,
                    message: 'Cédula inválida (7-8 dígitos)'
                  }
                })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Especialidad"
                  type="text"
                  placeholder="Ortodoncia"
                  icon={<Briefcase className="w-5 h-5 text-gray-400" />}
                  error={errors.especialidad?.message}
                  disabled={loading}
                  {...register('especialidad', {
                    required: 'La especialidad es requerida'
                  })}
                />

                <Input
                  label="Años de Experiencia"
                  type="number"
                  placeholder="5"
                  icon={<Clock className="w-5 h-5 text-gray-400" />}
                  error={errors.anos_experiencia?.message}
                  disabled={loading}
                  {...register('anos_experiencia', {
                    required: 'Los años de experiencia son requeridos',
                    min: {
                      value: 0,
                      message: 'Debe ser un número positivo'
                    },
                    max: {
                      value: 50,
                      message: 'Máximo 50 años'
                    }
                  })}
                />
              </div>
            </div>
          )}

          {userType === 'paciente' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Datos Personales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="5512345678"
                  icon={<Phone className="w-5 h-5 text-gray-400" />}
                  error={errors.telefono?.message}
                  helper="10 dígitos"
                  disabled={loading}
                  {...register('telefono', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: PHONE_REGEX,
                      message: 'Teléfono inválido (10 dígitos)'
                    }
                  })}
                />

                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  icon={<Calendar className="w-5 h-5 text-gray-400" />}
                  error={errors.fecha_nacimiento?.message}
                  disabled={loading}
                  {...register('fecha_nacimiento', {
                    required: 'La fecha de nacimiento es requerida'
                  })}
                />
              </div>

              <Input
                label="Dirección"
                type="text"
                placeholder="Calle 123, Colonia Centro"
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
                error={errors.direccion?.message}
                disabled={loading}
                {...register('direccion', {
                  required: 'La dirección es requerida'
                })}
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Crear Cuenta
          </Button>

          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </>
      )}
    </form>
  );
};

export default RegisterForm;