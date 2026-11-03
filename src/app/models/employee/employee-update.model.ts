import { EmployeeGenre, EmployeeStatus } from './employee.model';

export interface EmployeeUpdate {
  name: string;
  lastName: string;
  phoneNumber: string;
  genre: EmployeeGenre;
  dni: string;
  city: string;
  address: string;
  birth_date: string;
  hire_date: string;
  termination_date?: string;
  base_salary: number;
  status: EmployeeStatus;
}
