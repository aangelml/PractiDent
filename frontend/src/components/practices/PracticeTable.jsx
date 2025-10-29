import { Eye, Pencil, Trash2, Users, Clock, Calendar } from 'lucide-react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { 
  PRACTICE_ESTADO_COLORS, 
  PRACTICE_NIVEL_COLORS 
} from '../../utils/constants';

const PracticeTable = ({
  practices = [],
  onView,
  onEdit,
  onDelete,
  onViewPracticantes,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  showActions = true
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.tipo_practica}</p>
        </div>
      )
    },
    {
      key: 'nivel_dificultad',
      label: 'Nivel',
      render: (value) => (
        <Badge
          text={value?.charAt(0).toUpperCase() + value?.slice(1) || '-'}
          variant={PRACTICE_NIVEL_COLORS[value] || 'default'}
        />
      )
    },
    {
      key: 'duracion_estimada_horas',
      label: 'Duración',
      render: (value) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{value}h</span>
        </div>
      )
    },
    {
      key: 'cupo_disponible',
      label: 'Cupos',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">
            {value}/{row.cupo_maximo}
          </span>
        </div>
      )
    },
    {
      key: 'fecha_inicio',
      label: 'Periodo',
      render: (value, row) => (
        <div className="text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{formatDate(value)}</span>
          </div>
          <div className="text-gray-500">
            {formatDate(row.fecha_fin)}
          </div>
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (value) => (
        <Badge
          text={value?.charAt(0).toUpperCase() + value?.slice(1) || '-'}
          variant={PRACTICE_ESTADO_COLORS[value] || 'default'}
        />
      )
    }
  ];

  if (showActions) {
    columns.push({
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {onViewPracticantes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewPracticantes(row.id);
              }}
              title="Ver practicantes"
            >
              <Users className="w-4 h-4" />
            </Button>
          )}
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(row.id);
              }}
              title="Ver detalle"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.id);
              }}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.id);
              }}
              title="Eliminar"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    });
  }

  return (
    <Table
      columns={columns}
      data={practices}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
};

export default PracticeTable;