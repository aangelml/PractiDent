// frontend/src/services/appointmentService.js
import api from './api';

const appointmentService = {
  // Obtener horarios disponibles
  async getAvailableSlots(practicanteId, fecha, practicaId = 1) {
    try {
      console.log('🔍 appointmentService.getAvailableSlots llamado con:', {
        practicanteId,
        fecha,
        practicaId
      });

      const response = await api.get('/appointments/available-slots', {
        params: {
          practicante_id: practicanteId,
          fecha: fecha,
          practica_id: practicaId
        }
      });

      console.log('✅ Respuesta de available-slots:', response.data);

      return response.data;
    } catch (error) {
      console.error('❌ Error en getAvailableSlots:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener horarios disponibles',
        data: []
      };
    }
  },

  // Crear nueva cita
  async create(appointmentData) {
    try {
      console.log('📤 Creando cita:', appointmentData);
      
      const response = await api.post('/appointments', appointmentData);
      
      console.log('✅ Cita creada:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creando cita:', error);
      console.error('Error response:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear cita',
        errors: error.response?.data?.errors || []
      };
    }
  },

  // Obtener todas las citas
  async getAll(filters = {}) {
    try {
      const response = await api.get('/appointments', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo citas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener citas',
        data: []
      };
    }
  },

  // Obtener cita por ID
  async getById(id) {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener cita'
      };
    }
  },

  // Obtener mis citas (practicante)
  async getMyAppointments(filters = {}) {
    try {
      const response = await api.get('/appointments/my-appointments', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis citas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener citas',
        data: []
      };
    }
  },

  // Obtener citas del paciente
  async getPatientAppointments(filters = {}) {
    try {
      const response = await api.get('/appointments/patient/my-appointments', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener citas',
        data: []
      };
    }
  },

  // Confirmar cita
  async confirm(id) {
    try {
      const response = await api.patch(`/appointments/${id}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Error confirmando cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al confirmar cita'
      };
    }
  },

  // Cancelar cita
  async cancel(id, motivo_cancelacion = '') {
    try {
      const response = await api.patch(`/appointments/${id}/cancel`, {
        motivo_cancelacion
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelando cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cancelar cita'
      };
    }
  },

  // Completar cita
  async complete(id, data) {
    try {
      const response = await api.patch(`/appointments/${id}/complete`, data);
      return response.data;
    } catch (error) {
      console.error('Error completando cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al completar cita'
      };
    }
  },

  // Calificar cita
  async rate(id, calificacion_servicio) {
    try {
      const response = await api.put(`/appointments/${id}`, {
        calificacion_servicio
      });
      return response.data;
    } catch (error) {
      console.error('Error calificando cita:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al calificar cita'
      };
    }
  },

  // Obtener estadísticas
  async getStatistics() {
    try {
      const response = await api.get('/appointments/statistics');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener estadísticas',
        data: {
          total: 0,
          pendientes: 0,
          confirmadas: 0,
          completadas: 0,
          canceladas: 0,
          no_asistio: 0
        }
      };
    }
  }
};

export default appointmentService;