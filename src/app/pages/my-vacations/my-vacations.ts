import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { defer, finalize, Subscription } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import {
  MyVacationFilters,
  Vacation,
  VacationRequest,
  VacationStatus,
} from '../../models/vacation.models';
import { EmployeeService } from '../../services/employee.service';
import { VacationService } from '../../services/vacation.service';
import {
  addBusinessDays,
  dateRangeValidator,
  formatDate,
  formatPeriod,
  periodDays,
  todayDate,
} from './vacation-dates';

@Component({
  selector: 'app-my-vacations',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './my-vacations.html',
  styleUrls: ['./my-vacations.css', './vacation-requests.css'],
})
export class MyVacations implements OnInit {
  private readonly vacationService = inject(VacationService);
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestPanel = viewChild<ElementRef<HTMLElement>>('requestPanel');
  private listRequest: Subscription | null = null;
  private appliedDates: Pick<MyVacationFilters, 'startDate' | 'endDate'> = {};

  readonly page = signal(0);
  readonly size = signal(10);
  readonly status = signal<VacationStatus | ''>('');
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly loadFailed = signal(false);
  readonly editingVacation = signal<Vacation | null>(null);
  readonly toast = signal<{ message: string; type: ToastType; title: string } | null>(null);
  readonly vacationsPage = this.vacationService.vacationsPage;
  readonly vacations = this.vacationService.vacations;
  readonly employee = this.employeeService.currentEmployee;
  readonly today = todayDate();

  readonly minStartDate = computed(() => {
    const requestedOn = this.editingVacation()?.requestDate || this.today;
    const minimum = addBusinessDays(requestedOn, 5);
    return minimum < this.today ? this.today : minimum;
  });

  readonly vacationForm = this.fb.group(
    {
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    },
    {
      validators: (control) => {
        const rangeError = dateRangeValidator(control);
        const start = control.get('startDate')?.value;
        return rangeError ?? (start && start < this.minStartDate() ? { noticePeriod: true } : null);
      },
    },
  );

  readonly filterForm = this.fb.group(
    {
      startDate: [''],
      endDate: [''],
    },
    { validators: dateRangeValidator },
  );

  private readonly formDates = toSignal(this.vacationForm.valueChanges, {
    initialValue: this.vacationForm.getRawValue(),
  });

  readonly selectedPeriod = computed(() => {
    const { startDate, endDate } = this.formDates();
    if (!startDate || !endDate || endDate < startDate) return null;
    return { days: periodDays(startDate, endDate), label: formatPeriod(startDate, endDate) };
  });

  readonly statusFilters: readonly { value: VacationStatus | ''; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobadas' },
    { value: 'REJECTED', label: 'Rechazadas' },
  ];

  readonly statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
  };
  readonly formatDate = formatDate;
  readonly formatPeriod = formatPeriod;
  readonly periodDays = periodDays;

  constructor() {
    this.destroyRef.onDestroy(() => this.vacationService.clearVacations());
  }

  ngOnInit(): void {
    this.loadVacations();
  }

  loadVacations(): void {
    this.listRequest?.unsubscribe();
    if (this.toast()?.type === 'error') this.toast.set(null);
    this.vacationService.clearVacations();
    this.loadFailed.set(false);
    this.isLoading.set(true);

    this.listRequest = this.vacationService
      .getMyVacations({
        ...this.appliedDates,
        ...(this.status() ? { status: this.status() } : {}),
        page: this.page(),
        size: this.size(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (response) => this.page.set(response.page),
        error: (error: unknown) => {
          this.loadFailed.set(true);
          this.showError(error, 'No pudimos cargar tus solicitudes. Intentá nuevamente.');
        },
      });
  }

  applyFilters(): void {
    this.filterForm.markAllAsTouched();
    if (this.filterForm.invalid || this.isSubmitting()) return;
    const dates = this.filterForm.getRawValue();
    this.appliedDates = {
      ...(dates.startDate ? { startDate: dates.startDate } : {}),
      ...(dates.endDate ? { endDate: dates.endDate } : {}),
    };
    this.page.set(0);
    this.loadVacations();
  }

  selectStatus(status: VacationStatus | ''): void {
    if (this.filterForm.invalid || this.isSubmitting()) {
      this.filterForm.markAllAsTouched();
      return;
    }
    this.status.set(status);
    this.applyFilters();
  }

  clearFilters(): void {
    this.status.set('');
    this.filterForm.reset();
    this.applyFilters();
  }

  nextPage(): void {
    const response = this.vacationsPage();
    if (
      !response ||
      this.page() + 1 >= response.totalPages ||
      this.isLoading() ||
      this.isSubmitting()
    )
      return;
    this.page.update((value) => value + 1);
    this.loadVacations();
  }

  previousPage(): void {
    if (this.page() === 0 || this.isLoading() || this.isSubmitting()) return;
    this.page.update((value) => value - 1);
    this.loadVacations();
  }

  beginEdit(vacation: Vacation): void {
    if (vacation.status !== 'PENDING' || this.isSubmitting() || this.isLoading()) return;
    this.editingVacation.set(vacation);
    this.vacationForm.reset({ startDate: vacation.startDate, endDate: vacation.endDate });
    this.requestPanel()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }

  cancelEdit(): void {
    this.editingVacation.set(null);
    this.vacationForm.reset();
  }

  submitVacation(): void {
    this.vacationForm.markAllAsTouched();
    if (this.vacationForm.invalid || this.isSubmitting() || this.isLoading()) return;
    const employee = this.employee();
    if (!employee) {
      this.showError(
        null,
        'No pudimos identificar tu empleado. Recargá la página e intentá nuevamente.',
      );
      return;
    }
    const editing = this.editingVacation();
    if (editing && (editing.status !== 'PENDING' || editing.dniEmployee !== employee.dni)) {
      this.showError(null, 'Solo podés modificar tus propias solicitudes pendientes.');
      return;
    }
    const request: VacationRequest = {
      ...this.vacationForm.getRawValue(),
      dniEmployee: employee.dni,
      ...(editing ? { requestDate: editing.requestDate } : {}),
    };
    this.toast.set(null);
    this.isSubmitting.set(true);
    defer(() =>
      editing
        ? this.vacationService.updateVacation(editing.idVacation, request)
        : this.vacationService.createVacation(request),
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.toast.set({
            type: 'success',
            title: editing ? 'Solicitud actualizada' : 'Solicitud enviada',
            message: editing
              ? 'Guardamos los cambios de tus vacaciones.'
              : 'Tu solicitud quedó pendiente de revisión.',
          });
          this.cancelEdit();
          this.status.set('');
          this.filterForm.reset();
          this.appliedDates = {};
          this.page.set(0);
          this.loadVacations();
        },
        error: (error: unknown) =>
          this.showError(error, 'No pudimos guardar la solicitud. Intentá nuevamente.'),
      });
  }

  private showError(error: unknown, fallback: string): void {
    let message = fallback;
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) message = 'No pudimos conectar con el servidor. Intentá nuevamente.';
      else if (error.status === 401) message = 'Tu sesión venció. Volvé a iniciar sesión.';
      else if (error.status === 403) message = 'No tenés permisos para realizar esta acción.';
      else {
        const body = error.error;
        if (typeof body?.detail === 'string') message = body.detail;
        else if (typeof body?.message === 'string') message = body.message;
        else if (body && typeof body === 'object') {
          const fields = ['startDate', 'endDate', 'dniEmployee', 'requestDate'];
          const errors = fields
            .map((field) => body[field])
            .filter((value) => typeof value === 'string');
          if (errors.length) message = errors.join(' ');
        }
      }
    } else if (error instanceof Error) message = error.message;
    this.toast.set({ type: 'error', title: 'No se pudo completar la acción', message });
  }
}
