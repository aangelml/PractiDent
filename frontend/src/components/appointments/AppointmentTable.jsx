import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Calendar } from 'lucide-react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { APPOINTMENT_ESTADO_COLORS } from '../../utils/constants';

const AppointmentTable = ({ 
  appointments = [], 
  loading = false,
  onSort,
  sortBy,
  sortOrder,
  userRole
}) => {
  const navigate = useNavigate();

  // Formatear fecha y hora
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('es-MX', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dateStr} - ${timeStr}`;
  };

  // Definir columnas según rol
  const getColumns = () => {
    const baseColumns = [
      {
        key: 'fecha_hora',
        label: 'Fecha y Hora',
        sortable: true,
        render: (value) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-sm">{formatDateTime(value)}</span>
          </div>
        )
      }
    ];

    // Columnas según rol
    if (userRole === 'paciente') {
      baseColumns.push({
        key: 'practicante_nombre',
        label: 'Practicante',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-gray-900">{value}</span>
        )
      });
    } else if (userRole === 'practicante') {
      baseColumns.push({
        key: 'paciente_nombre',
        label: 'Paciente',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-gray-900">{value}</span>
        )
      });
    } else {
      // Admin y maestro ven ambos
      baseColumns.push(
        {
          key: 'practicante_nombre',
          label: 'Practicante',
          sortable: true,
          render: (value) => (
            <span className="font-medium text-gray-900">{value}</span>
          )
        },
        {
          key: 'paciente_nombre',
          label: 'Paciente',
          sortable: true,
          render: (value) => (
            <span className="font-medium text-gray-900">{value}</span>
          )
        }
      );
    }

    // Columnas comunes para todos
    baseColumns.push(
      {
        key: 'motivo_consulta',
        label: 'Motivo',
        render: (value) => (
          <span className="text-sm text-gray-700 line-clamp-2">{value}</span>
        )
      },
      {
        key: 'duracion_minutos',
        label: 'Duración',
        render: (value) => (
          <span className="text-sm text-gray-600">{value} min</span>
        )
      },
      {
        key: 'estado',
        label: 'Estado',
        sortable: true,
        render: (value) => (
          <Badge 
            text={value === 'no_asistio' ? 'No Asistió' : value.charAt(0).toUpperCase() + value.slice(1)}
            variant={APPOINTMENT_ESTADO_COLORS[value]}
          />
        )
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/citas/${row.id}`)}
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Botón confirmar (solo si está pendiente y es practicante/maestro/admin) */}
            {row.estado === 'pendiente' && ['practicante', 'maestro', 'admin'].includes(userRole) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Aquí iría la lógica de confirmar
                  navigate(`/citas/${row.id}`);
                }}
                title="Confirmar cita"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}

            {/* Botón cancelar (si está pendiente o confirmada) */}
            {['pendiente', 'confirmada'].includes(row.estado) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/citas/${row.id}`);
                }}
                title="Cancelar cita"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      }
    );

    return baseColumns;
  };

  return (
    <Table
      columns={getColumns()}
      data={appointments}
      loading={loading}
      onSort={onSort}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onRowClick={(row) => navigate(`/citas/${row.id}`)}
      className="cursor-pointer"
    />
  );
};

export default AppointmentTable;