import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    await login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div className="relative">
        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5 text-gray-400" />}
          error={errors.password?.message}
          disabled={loading}
          {...register('password', {
            required: 'La contraseña es requerida',
            minLength: {
              value: 8,
              message: 'La contraseña debe tener al menos 8 caracteres'
            }
          })}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            disabled={loading}
          />
          <span className="ml-2 text-sm text-gray-600">Recordarme</span>
        </label>

        <Link
          to="/forgot-password"
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        Iniciar Sesión
      </Button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes una cuenta?{' '}
        <Link
          to="/register"
          className="text-primary font-medium hover:text-primary/80 transition-colors"
        >
          Regístrate aquí
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;