import { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import practiceService from '../../services/practiceService';

const AssignModal = ({ open, onClose, practiceId, practiceName, onSuccess }) => {
  const [practicantes, setPracticantes] = useState([]);
  const [filteredPracticantes, setFilteredPracticantes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (open) {
      loadPracticantes();
    }
  }, [open]);

  useEffect(() => {
    if (search) {
      const filtered = practicantes.filter(p =>
        p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        p.apellido?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.matricula?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredPracticantes(filtered);
    } else {
      setFilteredPracticantes(practicantes);
    }
  }, [search, practicantes]);

  const loadPracticantes = async () => {
    try {
      setLoading(true);
      const result = await userService.getPracticantes();
      
      if (result.success) {
        setPracticantes(result.data || []);
        setFilteredPracticantes(result.data || []);
      } else {
        toast.error('Error al cargar practicantes');
      }
    } catch (error) {
      console.error('Error loading practicantes:', error);
      toast.error('Error al cargar practicantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (practicanteId) => {
    try {
      setAssigning(true);
      const result = await practiceService.assignPracticante(
        practiceId,
        practicanteId,
        observaciones
      );

      if (result.success) {
        toast.success(result.message || 'Practicante asignado exitosamente');
        onSuccess();
        onClose();
        setObservaciones('');
      } else {
        toast.error(result.message || 'Error al asignar practicante');
      }
    } catch (error) {
      console.error('Error assigning practicante:', error);
      toast.error('Error al asignar practicante');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignar Practicante"
      subtitle={`Práctica: ${practiceName}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Búsqueda */}
        <Input
          placeholder="Buscar por nombre, email o matrícula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5 text-gray-400" />}
        />

        {/* Observaciones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Observaciones (opcional)
          </label>
          <textarea
            rows="2"
            placeholder="Notas adicionales sobre la asignación..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Lista de Practicantes */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : filteredPracticantes.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No se encontraron practicantes
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPracticantes.map((practicante) => (
                <div
                  key={practicante.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {practicante.nombre} {practicante.apellido}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span>{practicante.email}</span>
                      {practicante.matricula && (
                        <>
                          <span>•</span>
                          <span>{practicante.matricula}</span>
                        </>
                      )}
                    </div>
                    {practicante.semestre && (
                      <Badge
                        text={`${practicante.semestre}° Semestre`}
                        variant="info"
                        size="sm"
                        className="mt-2"
                      />
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAssign(practicante.id)}
                    loading={assigning}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Asignar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AssignModal;