// Modelo de la vista; se adaptará a las respuestas de vacaciones y licencias.
export interface EmployeeHomeRequest {
  id: number;
  type: 'VACATION' | 'LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  submittedAt: string; // Fecha ISO de creación de la solicitud.
}
