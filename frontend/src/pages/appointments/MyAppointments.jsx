import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import AppointmentTable from '../../components/appointments/AppointmentTable';
import AppointmentFilters from '../../components/appointments/AppointmentFilters';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';

const MyAppointments = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [filters, setFilters] = useState({
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
    search: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [stats, setStats] = useState(null);

  // Modal para confirmar acciones
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadStats();
  }, [filters]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const result = userRole === 'paciente' 
        ? await appointmentService.getPatientAppointments(filters)
        : await appointmentService.getMyAppointments(filters);

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
      fecha_inicio: '',
      fecha_fin: '',
      search: '',
      page: 1,
      limit: 12
    });
  };

  // Acciones de citas
  const openModal = (action, appointmentId) => {
    setModalAction(action);
    setSelectedAppointmentId(appointmentId);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedAppointmentId || !modalAction) return;

    try {
      let result;
      
      switch (modalAction) {
        case 'confirm':
          result = await appointmentService.confirm(selectedAppointmentId);
          break;
        case 'cancel':
          result = await appointmentService.cancel(selectedAppointmentId);
          break;
        case 'noShow':
          result = await appointmentService.noShow(selectedAppointmentId);
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success(result.message);
        loadAppointments();
        loadStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al procesar la acción');
      console.error(error);
    } finally {
      setShowModal(false);
      setModalAction(null);
      setSelectedAppointmentId(null);
    }
  };

  const handleComplete = (appointmentId) => {
    navigate(`/citas/${appointmentId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-500" />
            Mis Citas
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'paciente' 
              ? 'Gestiona tus citas médicas'
              : 'Gestiona tu agenda de citas'
            }
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

          {/* Botón Agendar (solo paciente) */}
          {userRole === 'paciente' && (
            <Button
              onClick={() => navigate('/citas/nueva')}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agendar Cita
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
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
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ★
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
      />

      {/* Contenido */}
      {loading ? (
        <Loader text="Cargando citas..." />
      ) : appointments.length === 0 ? (
        <Alert type="info">
          No se encontraron citas. 
          {userRole === 'paciente' && (
            <span> <a href="/citas/nueva" className="font-semibold underline">Agenda tu primera cita aquí</a>.</span>
          )}
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
                  onConfirm={(id) => openModal('confirm', id)}
                  onCancel={(id) => openModal('cancel', id)}
                  onComplete={handleComplete}
                  onNoShow={(id) => openModal('noShow', id)}
                />
              ))}
            </div>
          ) : (
            <AppointmentTable
              appointments={appointments}
              loading={loading}
              userRole={userRole}
            />
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Modal de Confirmación */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalAction === 'confirm' ? 'Confirmar Cita' :
          modalAction === 'cancel' ? 'Cancelar Cita' :
          'Marcar como No Asistió'
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant={modalAction === 'cancel' ? 'danger' : 'primary'}
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          {modalAction === 'confirm' && '¿Estás seguro de confirmar esta cita?'}
          {modalAction === 'cancel' && '¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer.'}
          {modalAction === 'noShow' && '¿Marcar al paciente como no asistió?'}
        </p>
      </Modal>
    </div>
  );
};

export default MyAppointments;