import { EmployeeUpdate } from './employee-update.model';

export type EmployeeCreateRequest = Omit<EmployeeUpdate, 'status' | 'termination_date'> & {
  id_branch: number;
  id_position: number;
  id_department: number;
};
