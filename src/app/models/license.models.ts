import { VacationStatus } from './vacation.models';

export interface LicenseRequest {
  startDate: string;
  endDate: string;
  motive: string;
}

export interface License extends LicenseRequest {
  id: number;
  requestDate: string;
  status: VacationStatus;
  isPaid: boolean;
  reviewedByAccountId: number | null;
  reviewComment: string | null;
  idCertificates: number[];
  dniEmployee: string;
}

export interface LicenseReviewRequest {
  status: Extract<License['status'], 'APPROVED' | 'REJECTED'>;
  isPaid: boolean;
  reviewComment?: string | null;
}

export interface CertificateInfo {
  description: string;
  uploadDate: string;
  idLicense: number;
}

export interface MyLicenseFilters {
  status?: License['status'];
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface LicenseFilters extends MyLicenseFilters {
  dniEmployee?: string;
}
