import { EmployeeStatus } from "./employee.model";


export interface EmployeeFilter {
  fullName?: string;
  dni?: string;
  id_branch?: number;

  hire_date?: string;
  termination_date?: string;

  status?: EmployeeStatus;
  position?: string;
  department?: string;

  min_salary?: number;
  max_salary?: number;

  page?: number;
  size?: number;
  sort?: string;
}