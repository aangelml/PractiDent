import { Search, Filter, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { APPOINTMENT_ESTADOS_OPTIONS } from '../../utils/constants';

const AppointmentFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  showPracticanteFilter = false,
  showPacienteFilter = false,
  practicantes = [],
  pacientes = []
}) => {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = () => {
    return filters.estado || filters.search || filters.fecha_inicio || filters.fecha_fin || 
           filters.practicante_id || filters.paciente_id;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <Input
          type="text"
          placeholder="Buscar por paciente o motivo..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          icon={<Search className="w-5 h-5 text-gray-400" />}
        />

        {/* Estado */}
        <Select
          placeholder="Todos los estados"
          options={APPOINTMENT_ESTADOS_OPTIONS}
          value={filters.estado || ''}
          onChange={(e) => handleChange('estado', e.target.value)}
        />

        {/* Fecha Inicio */}
        <Input
          type="date"
          label="Fecha Desde"
          value={filters.fecha_inicio || ''}
          onChange={(e) => handleChange('fecha_inicio', e.target.value)}
        />

        {/* Fecha Fin */}
        <Input
          type="date"
          label="Fecha Hasta"
          value={filters.fecha_fin || ''}
          onChange={(e) => handleChange('fecha_fin', e.target.value)}
        />

        {/* Filtro de Practicante (solo para admin/maestro) */}
        {showPracticanteFilter && practicantes.length > 0 && (
          <Select
            label="Practicante"
            placeholder="Todos los practicantes"
            options={practicantes.map(p => ({
              value: p.id,
              label: `${p.nombre} ${p.apellido}`
            }))}
            value={filters.practicante_id || ''}
            onChange={(e) => handleChange('practicante_id', e.target.value)}
          />
        )}

        {/* Filtro de Paciente (solo para admin/maestro) */}
        {showPacienteFilter && pacientes.length > 0 && (
          <Select
            label="Paciente"
            placeholder="Todos los pacientes"
            options={pacientes.map(p => ({
              value: p.id,
              label: `${p.nombre} ${p.apellido}`
            }))}
            value={filters.paciente_id || ''}
            onChange={(e) => handleChange('paciente_id', e.target.value)}
          />
        )}
      </div>

      {/* Contador de resultados */}
      {hasActiveFilters() && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {Object.keys(filters).filter(k => filters[k] && k !== 'page' && k !== 'limit').length} filtro(s) activo(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default AppointmentFilters;