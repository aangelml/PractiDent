import { Link } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import Card from '../../components/ui/Card';

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">PRACTIDENT</span>
        </Link>

        {/* Login Card */}
        <Card className="shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          <LoginForm />
        </Card>

        {/* Link de regreso */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;