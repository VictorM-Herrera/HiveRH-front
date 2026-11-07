import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, finalize, of, startWith, switchMap } from 'rxjs';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { Vacation, VacationFilters, VacationStatus } from '../../models/vacation.models';
import { VacationService } from '../../services/vacation.service';
import {
  dateRangeValidator,
  formatDate,
  formatPeriod,
  periodDays,
} from '../my-vacations/vacation-dates';

const initialFilters = { status: 'PENDING', page: 0, size: 8 } as const;

@Component({
  selector: 'app-team-vacations',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './team-vacations.html',
  styleUrls: ['../team-licenses/team-licenses.css', './team-vacations.css'],
})
export class TeamVacations {
  private readonly vacations = inject(VacationService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly query = new BehaviorSubject<VacationFilters>(initialFilters);
  private readonly requestedId = signal<number | null>(null);

  readonly filterForm = this.fb.group(
    {
      search: '',
      status: this.fb.control<VacationStatus | ''>(initialFilters.status),
      startDate: '',
      endDate: '',
    },
    { validators: dateRangeValidator },
  );
  readonly reviewForm = this.fb.group({ comment: ['', Validators.maxLength(500)] });
  readonly statusLabels: Record<VacationStatus, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
  };
  readonly formatDate = formatDate;
  readonly formatPeriod = formatPeriod;
  readonly periodDays = periodDays;
  readonly isSaving = signal(false);
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);

  readonly listResult = toSignal(
    this.query.pipe(
      switchMap((filters) =>
        this.vacations.getVacations(filters).pipe(
          switchMap((page) =>
            page.page > 0 && page.page >= page.totalPages
              ? this.vacations.getVacations({ ...filters, page: Math.max(0, page.totalPages - 1) })
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
  readonly selectedVacation = computed<Vacation | null>(() => {
    const rows = this.page()?.element ?? [];
    return (
      rows.find((vacation) => vacation.idVacation === this.requestedId()) ?? rows.at(0) ?? null
    );
  });

  applyFilters(): void {
    if (this.isSaving() || this.filterForm.invalid) return;
    const { search, status, startDate, endDate } = this.filterForm.getRawValue();
    const term = search.trim();
    const dni = term.replace(/[.\s]/g, '');
    const isDni = /^\d+$/.test(dni);
    this.requestedId.set(null);
    this.reviewForm.reset();
    this.query.next({
      page: 0,
      size: initialFilters.size,
      status: status || undefined,
      startDate,
      endDate,
      ...(isDni ? { dniEmployee: dni } : { fullName: term }),
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadPage(page = this.query.value.page ?? 0): void {
    if (this.isSaving()) return;
    this.reviewForm.reset();
    this.query.next({ ...this.query.value, page });
  }

  selectVacation(id: number): void {
    if (this.isSaving() || this.selectedVacation()?.idVacation === id) return;
    this.reviewForm.reset();
    this.requestedId.set(id);
  }

  initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  review(status: 'APPROVED' | 'REJECTED'): void {
    const vacation = this.selectedVacation();
    if (vacation?.status !== 'PENDING' || this.isSaving() || this.reviewForm.invalid) return;

    const { idVacation, dniEmployee, requestDate, startDate, endDate } = vacation;
    const { comment } = this.reviewForm.getRawValue();
    const page = this.page()?.page ?? 0;
    this.isSaving.set(true);
    this.vacations
      .updateVacation(idVacation, {
        dniEmployee,
        requestDate,
        startDate,
        endDate,
        status,
        reviewComment: comment.trim() || null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.reviewForm.reset();
          this.query.next({ ...this.query.value, page });
          this.toast.set({
            type: 'success',
            title: 'Revisión guardada',
            message: `Solicitud ${this.statusLabels[status].toLowerCase()}.`,
          });
        },
        error: (error: unknown) => {
          const body =
            error instanceof HttpErrorResponse && error.status === 400 ? error.error : null;
          const detail = body?.detail ?? body?.startDate ?? body?.endDate;
          this.toast.set({
            type: 'error',
            title: 'No se pudo guardar la revisión',
            message: typeof detail === 'string' ? detail : 'Intentá nuevamente.',
          });
        },
      });
  }
}
