import { VacationStatus } from './vacation.models';

export interface EmployeeHomeRequest {
  id: number;
  type: 'VACATION' | 'LEAVE';
  status: VacationStatus;
  startDate: string;
  endDate: string;
  submittedAt: string;
}
