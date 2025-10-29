import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Clock, Calendar, User, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import practiceService from '../../services/practiceService';
import { 
  PRACTICE_ESTADO_COLORS,
  PRACTICE_NIVEL_COLORS,
  ASSIGNMENT_ESTADOS_OPTIONS,
  ASSIGNMENT_ESTADO_COLORS
} from '../../utils/constants';

const MyPractices = () => {
  const navigate = useNavigate();
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    asignadas: 0,
    en_progreso: 0,
    completadas: 0
  });

  useEffect(() => {
    loadMyPractices();
  }, [estadoFilter]);

  const loadMyPractices = async () => {
    try {
      setLoading(true);
      const result = await practiceService.getMyPractices({
        estado: estadoFilter
      });

      if (result.success) {
        const practicesData = Array.isArray(result.data) ? result.data : [];
        setPractices(practicesData);
        
        // Calcular estadísticas
        setStats({
          total: practicesData.length,
          asignadas: practicesData.filter(p => p.estado_asignacion === 'asignado').length,
          en_progreso: practicesData.filter(p => p.estado_asignacion === 'en_progreso').length,
          completadas: practicesData.filter(p => p.estado_asignacion === 'completado').length
        });
      } else {
        toast.error(result.message || 'Error al cargar prácticas');
      }
    } catch (error) {
      console.error('Error loading my practices:', error);
      toast.error('Error al cargar prácticas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetail = (id) => {
    navigate(`/mis-practicas/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Prácticas</h1>
        <p className="mt-1 text-gray-600">Prácticas odontológicas asignadas</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 font-medium">Total</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 font-medium">Asignadas</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.asignadas}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm text-yellow-700 font-medium">En Progreso</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.en_progreso}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-green-700 font-medium">Completadas</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.completadas}</p>
          </div>
        </Card>
      </div>

      {/* Filtro */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Select
              label="Filtrar por Estado"
              placeholder="Todos los estados"
              options={ASSIGNMENT_ESTADOS_OPTIONS}
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            />
          </div>
          {estadoFilter && (
            <Button
              variant="ghost"
              onClick={() => setEstadoFilter('')}
            >
              Limpiar Filtro
            </Button>
          )}
        </div>
      </Card>

      {/* Lista de Prácticas */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : practices.length === 0 ? (
        <Card>
          <div className="text-center p-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay prácticas asignadas
            </h3>
            <p className="text-gray-600">
              Cuando tu maestro te asigne prácticas, aparecerán aquí
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {practices.map((practice) => (
            <Card 
              key={practice.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetail(practice.id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {practice.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">{practice.tipo_practica}</p>
                  </div>
                  <Badge
                    text={practice.estado_asignacion?.replace('_', ' ')}
                    variant={ASSIGNMENT_ESTADO_COLORS[practice.estado_asignacion] || 'info'}
                  />
                </div>

                {/* Descripción */}
                {practice.descripcion && (
                  <p className="text-gray-700 line-clamp-2">
                    {practice.descripcion}
                  </p>
                )}

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Nivel</span>
                    </div>
                    <Badge
                      text={practice.nivel_dificultad?.charAt(0).toUpperCase() + practice.nivel_dificultad?.slice(1)}
                      variant={PRACTICE_NIVEL_COLORS[practice.nivel_dificultad]}
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>Duración</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {practice.duracion_estimada_horas} horas
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>Maestro</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {practice.maestro_nombre || 'No asignado'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Periodo</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(practice.fecha_inicio)}
                    </p>
                  </div>
                </div>

                {/* Estado de la Práctica */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estado de la práctica:</span>
                    <Badge
                      text={practice.estado?.charAt(0).toUpperCase() + practice.estado?.slice(1)}
                      variant={PRACTICE_ESTADO_COLORS[practice.estado]}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Calificación */}
                {practice.calificacion_maestro && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Calificación:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {practice.calificacion_maestro}
                        </span>
                        <span className="text-sm text-gray-500">/ 5.0</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observaciones */}
                {practice.observaciones && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Observaciones del maestro:</p>
                    <p className="text-sm text-gray-900 italic">
                      "{practice.observaciones}"
                    </p>
                  </div>
                )}

                {/* Botón Ver Detalle */}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(practice.id);
                    }}
                  >
                    Ver Detalle Completo
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPractices;