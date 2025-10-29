import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PracticeForm from '../../components/practices/PracticeForm';
import practiceService from '../../services/practiceService';

const CreatePractice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await practiceService.create(data);

      if (result.success) {
        toast.success(result.message || 'Práctica creada exitosamente');
        navigate('/practicas');
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            toast.error(error.message || error);
          });
        } else {
          toast.error(result.message || 'Error al crear práctica');
        }
      }
    } catch (error) {
      console.error('Error creating practice:', error);
      toast.error('Error al crear práctica');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/practicas');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/practicas')}
          className="gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Práctica</h1>
          <p className="mt-1 text-gray-600">Crea una nueva práctica odontológica</p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <PracticeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default CreatePractice;