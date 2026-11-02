export type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Vacation {
  idVacation: number;
  requestDate: string;
  status: VacationStatus;
  startDate: string;
  endDate: string;

  reviewedByAccountId: number | null;
  reviewComment: string | null;

  dniEmployee: string;
  employeeName: string;
}

export interface VacationRequest {
  startDate: string;
  endDate: string;
  dniEmployee: string;
  requestDate?: string;
}
export interface VacationFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  dniEmployee?: string;
  fullName?: string;

  page?: number;
  size?: number;
}

export type MyVacationFilters = Omit<VacationFilters, 'dniEmployee' | 'fullName'>;
