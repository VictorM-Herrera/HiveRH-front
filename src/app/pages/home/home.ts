import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { EmployeeHomeRequest } from '../../models/employee-home.models';
import { AuthService } from '../../services/auth.service';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly requests = signal<EmployeeHomeRequest[]>([]);
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
    this.vacationService
      .getAllMyVacations()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (vacations) => {
          this.requests.set(
            vacations.map((vacation) => ({
              id: vacation.idVacation,
              type: 'VACATION',
              status: vacation.status,
              startDate: vacation.startDate,
              endDate: vacation.endDate,
              submittedAt: vacation.requestDate,
            })),
          );
        },
        error: () => this.error.set('No pudimos cargar tus solicitudes. Intentá nuevamente.'),
      });
  }
}
