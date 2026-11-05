import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { zipSync } from 'fflate';
import {
  BehaviorSubject,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { Employee } from '../../models/employee/employee.model';
import { License, LicenseFilters, LicenseReviewRequest } from '../../models/license.models';
import { EmployeeService } from '../../services/employee.service';
import { LicencesService } from '../../services/licences.service';
import {
  dateRangeValidator,
  formatDate,
  formatPeriod,
  periodDays,
} from '../my-vacations/vacation-dates';

const initialFilters = { status: 'PENDING', page: 0, size: 8, sort: 'requestDate,desc' } as const;

@Component({
  selector: 'app-team-licenses',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './team-licenses.html',
  styleUrl: './team-licenses.css',
})
export class TeamLicenses {
  private readonly licences = inject(LicencesService);
  private readonly employees = inject(EmployeeService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly query = new BehaviorSubject<LicenseFilters>(initialFilters);
  private readonly requestedId = signal<number | null>(null);

  readonly filterForm = this.fb.group(
    {
      dniEmployee: '',
      status: this.fb.control<License['status'] | ''>(initialFilters.status),
      startDate: '',
      endDate: '',
      payment: '',
      sort: this.fb.control<string>(initialFilters.sort),
    },
    { validators: dateRangeValidator },
  );
  readonly reviewForm = this.fb.group({
    payment: '',
    comment: ['', Validators.maxLength(500)],
  });

  readonly statusLabels: Record<License['status'], string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
  };
  readonly formatDate = formatDate;
  readonly formatPeriod = formatPeriod;
  readonly periodDays = periodDays;
  readonly isSaving = signal(false);
  readonly isDownloading = signal(false);
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);

  readonly listResult = toSignal(
    this.query.pipe(
      switchMap((filters) =>
        this.licences.getLicenses(filters).pipe(
          switchMap((page) =>
            page.page > 0 && page.page >= page.totalPages
              ? this.licences.getLicenses({ ...filters, page: Math.max(0, page.totalPages - 1) })
              : of(page),
          ),
          catchError(() => of('error' as const)),
          startWith(null),
        ),
      ),
    ),
    { initialValue: null },
  );
  readonly page = computed(() => {
    const result = this.listResult();
    return result === 'error' ? null : result;
  });
  readonly selectedRow = computed<License | null>(() => {
    const rows = this.page()?.element ?? [];
    return rows.find((license) => license.id === this.requestedId()) ?? rows.at(0) ?? null;
  });
  readonly detailResult = toSignal(
    toObservable(this.selectedRow).pipe(
      switchMap((row) => {
        this.reviewForm.reset();
        if (!row) return of(null);
        return this.licences.getLicense(row.id).pipe(
          catchError(() => of('error' as const)),
          startWith(null),
        );
      }),
    ),
    { initialValue: null },
  );
  readonly selectedLicense = computed(() => {
    const detail = this.detailResult();
    return detail && detail !== 'error' && detail.id === this.selectedRow()?.id ? detail : null;
  });
  readonly employeeByDni = toSignal(
    toObservable(this.page).pipe(
      switchMap((page) => {
        const dnis = [...new Set(page?.element.map((license) => license.dniEmployee))];
        if (!dnis.length) return of(new Map<string, Employee | null>());
        return forkJoin(
          dnis.map((dni) =>
            this.employees.getEmployee(dni).pipe(
              map((employee) => [dni, employee] as const),
              catchError(() => of([dni, null] as const)),
            ),
          ),
        ).pipe(map((entries) => new Map(entries)));
      }),
    ),
    { initialValue: new Map<string, Employee | null>() },
  );
  applyFilters(): void {
    if (this.isSaving() || this.filterForm.invalid) return;
    const { dniEmployee, status, startDate, endDate, payment, sort } =
      this.filterForm.getRawValue();
    this.requestedId.set(null);
    this.query.next({
      page: 0,
      size: initialFilters.size,
      dniEmployee: dniEmployee.trim(),
      status: status || undefined,
      startDate,
      endDate,
      isPaid: payment ? payment === 'paid' : undefined,
      sort,
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadPage(page: number): void {
    if (this.isSaving()) return;
    this.query.next({ ...this.query.value, page });
  }

  selectLicense(id: number): void {
    if (!this.isSaving()) this.requestedId.set(id);
  }

  review(status: LicenseReviewRequest['status']): void {
    const license = this.selectedLicense();
    if (license?.status !== 'PENDING' || this.isSaving() || this.reviewForm.invalid) return;

    const { payment, comment } = this.reviewForm.getRawValue();
    if (status === 'APPROVED' && !payment) {
      this.reviewForm.controls.payment.markAsTouched();
      return;
    }

    const page = this.page()?.page ?? 0;
    this.isSaving.set(true);
    this.licences
      .reviewLicense(license.id, {
        status,
        isPaid: status === 'APPROVED' && payment === 'paid',
        reviewComment: comment.trim() || null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.query.next({ ...this.query.value, page });
          this.notify('success', `Licencia ${this.statusLabels[status].toLowerCase()}.`);
        },
        error: () => this.notify('error', 'No pudimos guardar la revisión. Intentá nuevamente.'),
      });
  }

  downloadCertificates(license: License): void {
    if (this.isDownloading() || !license.idCertificates.length) return;
    this.isDownloading.set(true);

    forkJoin(
      license.idCertificates.map((id) =>
        this.licences.downloadCertificate(id).pipe(
          switchMap((pdf) => pdf.arrayBuffer()),
          map((bytes) => [`certificado-${id}.pdf`, new Uint8Array(bytes)] as const),
        ),
      ),
    )
      .pipe(
        map((files) => {
          const archive = zipSync(Object.fromEntries(files), { level: 0 });
          return new Blob([archive], { type: 'application/zip' });
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDownloading.set(false)),
      )
      .subscribe({
        next: (archive) => {
          const url = URL.createObjectURL(archive);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificados-licencia-${license.id}.zip`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: () =>
          this.notify('error', 'No pudimos descargar los certificados. Intentá nuevamente.'),
      });
  }

  private notify(type: ToastType, message: string): void {
    this.toast.set({
      type,
      title: type === 'success' ? 'Revisión guardada' : 'No se pudo completar la acción',
      message,
    });
  }
}
