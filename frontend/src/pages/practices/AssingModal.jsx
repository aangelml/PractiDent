// frontend/src/components/practices/AssignModal.jsx
import { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loader from '../ui/Loader';
import userService from '../../services/userService';
import practiceService from '../../services/practiceService';

const AssignModal = ({ open, onClose, practiceId, practiceName, onSuccess }) => {
  const [practicantes, setPracticantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPracticante, setSelectedPracticante] = useState(null);

  useEffect(() => {
    if (open) {
      loadPracticantes();
    }
  }, [open]);

  const loadPracticantes = async () => {
    try {
      setLoading(true);
      const result = await userService.getPracticantes();

      if (result.success) {
        setPracticantes(result.data || []);
      } else {
        toast.error(result.message || 'Error al cargar practicantes');
      }
    } catch (error) {
      console.error('Error loading practicantes:', error);
      toast.error('Error al cargar practicantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPracticante) {
      toast.error('Selecciona un practicante');
      return;
    }

    try {
      setAssigning(true);
      const result = await practiceService.assignPracticante(
        practiceId,
        selectedPracticante.id
      );

      if (result.success) {
        toast.success(result.message || 'Practicante asignado exitosamente');
        setSelectedPracticante(null);
        onSuccess();
        onClose();
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

  const filteredPracticantes = practicantes.filter(p => {
    const searchLower = search.toLowerCase();
    const fullName = `${p.nombre} ${p.apellido}`.toLowerCase();
    const matricula = p.matricula?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || matricula.includes(searchLower);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignar Practicante"
      subtitle={`Práctica: ${practiceName}`}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={assigning}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            loading={assigning}
            disabled={!selectedPracticante || assigning}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Asignar Practicante
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Búsqueda */}
        <Input
          type="text"
          placeholder="Buscar por nombre o matrícula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4 text-gray-400" />}
        />

        {/* Lista de Practicantes */}
        {loading ? (
          <Loader text="Cargando practicantes..." />
        ) : filteredPracticantes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {search ? 'No se encontraron practicantes' : 'No hay practicantes disponibles'}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredPracticantes.map((practicante) => (
              <button
                key={practicante.id}
                type="button"
                onClick={() => setSelectedPracticante(practicante)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedPracticante?.id === practicante.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {practicante.nombre} {practicante.apellido}
                    </p>
                    <p className="text-sm text-gray-600">
                      {practicante.email}
                    </p>
                    {practicante.matricula && (
                      <p className="text-xs text-gray-500 mt-1">
                        Matrícula: {practicante.matricula}
                      </p>
                    )}
                  </div>
                  {selectedPracticante?.id === practicante.id && (
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Al asignar un practicante, podrá ver esta práctica en "Mis Prácticas" y recibir citas relacionadas.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AssignModal;