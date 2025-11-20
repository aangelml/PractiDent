import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LayoutGrid, List, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import Alert from '../../components/ui/Alert';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import AppointmentTable from '../../components/appointments/AppointmentTable';
import AppointmentFilters from '../../components/appointments/AppointmentFilters';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

const AppointmentsList = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [practicantes, setPracticantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'cards' o 'table'
  const [filters, setFilters] = useState({
    estado: '',
    practicante_id: '',
    paciente_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    search: '',
    page: 1,
    limit: 15
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('fecha_hora');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters, sortBy, sortOrder]);

  const loadInitialData = async () => {
    try {
      // Cargar practicantes
      const practicantesResult = await userService.getPracticantes();
      if (practicantesResult.success) {
        setPracticantes(practicantesResult.data);
      }

      // Cargar pacientes
      const pacientesResult = await userService.getPacientes();
      if (pacientesResult.success) {
        setPacientes(pacientesResult.data);
      }

      // Cargar estadísticas
      loadStats();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const result = await appointmentService.getAll({
        ...filters,
        sortBy,
        sortOrder
      });

      if (result.success) {
        setAppointments(result.data);
        setPagination({
          currentPage: filters.page,
          totalPages: result.pagination?.totalPages || 1,
          total: result.total || 0
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al cargar citas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await appointmentService.getStatistics();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      estado: '',
      practicante_id: '',
      paciente_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      search: '',
      page: 1,
      limit: 15
    });
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const exportData = () => {
    // Aquí se podría implementar exportación a CSV/Excel
    toast.info('Función de exportación en desarrollo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-500" />
            Gestión de Citas
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' ? 'Todas las citas del sistema' : 'Citas de tus practicantes'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 rounded-md transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Botón Exportar */}
          <Button
            variant="outline"
            onClick={exportData}
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendientes || 0}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                !
              </div>
            </div>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmadas || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ✓
              </div>
            </div>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completadas || 0}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ★
              </div>
            </div>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.canceladas || 0}</p>
              </div>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                ✕
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <AppointmentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showPracticanteFilter={true}
        showPacienteFilter={true}
        practicantes={practicantes}
        pacientes={pacientes}
      />

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Mostrando {appointments.length} de {pagination.total} citas
        </span>
        {sortBy && (
          <span>
            Ordenado por: {sortBy === 'fecha_hora' ? 'Fecha' : sortBy} ({sortOrder === 'asc' ? 'Ascendente' : 'Descendente'})
          </span>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <Loader text="Cargando citas..." />
      ) : appointments.length === 0 ? (
        <Alert type="info">
          No se encontraron citas con los filtros aplicados.
        </Alert>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole={userRole}
                  onConfirm={(id) => navigate(`/citas/${id}`)}
                  onCancel={(id) => navigate(`/citas/${id}`)}
                  onComplete={(id) => navigate(`/citas/${id}`)}
                  onNoShow={(id) => navigate(`/citas/${id}`)}
                />
              ))}
            </div>
          ) : (
            <AppointmentTable
              appointments={appointments}
              loading={loading}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              userRole={userRole}
            />
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={filters.limit}
              showItemsPerPage={true}
              onItemsPerPageChange={(limit) => setFilters(prev => ({ ...prev, limit, page: 1 }))}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsList;