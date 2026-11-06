import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, merge, tap } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { EmployeeHomeRequest } from '../../models/employee-home.models';
import { AuthService } from '../../services/auth.service';
import { LicencesService } from '../../services/licences.service';
import { VacationService } from '../../services/vacation.service';
import { AdminHome } from './admin-home/admin-home';
import { EmployeeHome } from './employee-home/employee-home';
import { StaffHome } from './staff-home/staff-home';

@Component({
  selector: 'app-home',
  imports: [AdminHome, EmployeeHome, StaffHome, LoadingCircleComponent, ToastComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly vacationService = inject(VacationService);
  private readonly licencesService = inject(LicencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vacationRequests = signal<EmployeeHomeRequest[]>([]);
  private readonly licenseRequests = signal<EmployeeHomeRequest[]>([]);

  readonly requests = computed<EmployeeHomeRequest[]>(() => [
    ...this.vacationRequests(),
    ...this.licenseRequests(),
  ]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly homeRole = computed(() => {
    const roles = this.authService.roles();
    if (roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (roles.includes('ROLE_STAFF')) return 'STAFF';
    return 'EMPLOYEE';
  });

  ngOnInit(): void {
    if (this.homeRole() !== 'EMPLOYEE') return;
    this.isLoading.set(true);
    const firstPage = { page: 0, size: 10 };
    const vacations$ = this.vacationService.getMyVacations(firstPage).pipe(
      tap(({ element: vacations }) => {
        this.vacationRequests.set(
          vacations.map((vacation) => ({
            id: vacation.idVacation,
            type: 'VACATION',
            status: vacation.status,
            startDate: vacation.startDate,
            endDate: vacation.endDate,
            submittedAt: vacation.requestDate,
          })),
        );
      }),
      catchError(() => {
        this.error.set('No pudimos cargar tus vacaciones. Intentá nuevamente.');
        return EMPTY;
      }),
    );
    const licenses$ = this.licencesService.getMyLicenses(firstPage).pipe(
      tap(({ element: licenses }) => {
        this.licenseRequests.set(
          licenses.map((license) => ({
            id: license.id,
            type: 'LEAVE',
            status: license.status,
            startDate: license.startDate,
            endDate: license.endDate,
            submittedAt: license.requestDate,
          })),
        );
      }),
      catchError(() => {
        this.error.set('No pudimos cargar tus licencias. Intentá nuevamente.');
        return EMPTY;
      }),
    );
    merge(vacations$, licenses$)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe();
  }
}
