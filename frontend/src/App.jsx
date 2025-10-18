import { Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth.js';

// Layout
import Layout from './components/layout/Layout.jsx';

// Auth Components
import PrivateRoute from './components/auth/PrivateRoute.jsx';
import RoleRoute from './components/auth/RoleRoute.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import MaestroDashboard from './pages/dashboard/MaestroDashboard.jsx';
import PracticanteDashboard from './pages/dashboard/PracticanteDashboard.jsx';
import PacienteDashboard from './pages/dashboard/PacienteDashboard.jsx';

// Users Pages (SPRINT F2)
import UsersList from './pages/users/UsersList.jsx';
import CreateUser from './pages/users/CreateUser.jsx';
import UserDetail from './pages/users/UserDetail.jsx';

// Components
import Loader from './components/ui/Loader.jsx';

// Constants
import { ROLES } from './utils/constants.js';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader fullScreen text="Cargando aplicación..." />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#0ea5e9',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Protegidas con Layout */}
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/maestro"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.MAESTRO]}>
                <Layout>
                  <MaestroDashboard />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/practicante"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.PRACTICANTE]}>
                <Layout>
                  <PracticanteDashboard />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/paciente"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.PACIENTE]}>
                <Layout>
                  <PacienteDashboard />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* RUTAS SPRINT F2 - CRUD DE USUARIOS (Solo Admin) */}
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <Layout>
                  <UsersList />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios/nuevo"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <Layout>
                  <CreateUser />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios/:id"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <Layout>
                  <UserDetail />
                </Layout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* Ruta de No Autorizado */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Acceso No Autorizado
                </h2>
                <p className="text-gray-600 mb-6">
                  No tienes permisos para acceder a este recurso.
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          }
        />

        {/* Ruta 404 - Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Página No Encontrada
                </h2>
                <p className="text-gray-600 mb-6">
                  La página que buscas no existe.
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;