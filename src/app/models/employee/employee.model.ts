export type EmployeeGenre =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'
  | 'NON_BINARY';

export type EmployeeStatus =
  | 'ACTIVE'
  | 'TERMINATED';

export interface EmployeeAssignment {
  branchName: string;
  departmentName: string;
  positionName: string;

  startDate: string;
  endDate: string | null;

  active: boolean;
}
export interface Employee {
  name: string;
  lastName: string;
  phoneNumber: string;
  genre: EmployeeGenre;
  dni: string;
  city: string;
  address: string;

  birthdate: string; // YYYY-MM-DD
  hireDate: string;
  terminationDate: string | null;

  baseSalary: number;
  status: EmployeeStatus;

  assignments: EmployeeAssignment[];
}