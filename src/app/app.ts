import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { NavBar } from './shared/nav-bar/nav-bar';
import { AuthService } from './services/auth.service';
import { EmployeeService } from './services/employee.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly _authService = inject(AuthService);
  private readonly _employeeService = inject(EmployeeService);

  readonly currentEmployee = this._employeeService.currentEmployee;

  readonly userName = computed(() => {
    const employee = this.currentEmployee();
    if (employee) {
      return `${employee.name} ${employee.lastName}`;
    }
    //por si el admin no tiene empleado
    return this._authService.session()?.identifier ?? 'Mi Cuenta';
  });

  readonly userRole = computed(() => {
    const roles = this._authService.roles();
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_STAFF')) return 'Staff';
    return 'Empleado';
  });

  readonly showNavigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects !== '/'),
      startWith(this.router.url !== '/'),
    ),
    { requireSync: true },
  );

  constructor() {
    toObservable(this._authService.session)
      .pipe(
        map((session) => session?.identifier ?? null),
        distinctUntilChanged(),
        switchMap((identifier) => {
          this._employeeService.clearCurrentEmployee();
          if (identifier === null) return EMPTY;

          return this._employeeService.loadCurrentEmployee().pipe(
            catchError((err) => {
              console.log('No se pudo cargar el empleado.', err);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  logout(): void {
    this._authService
      .logout()
      .pipe(
        finalize(() => {
          this.router.navigate(['/']);
        }),
      )
      .subscribe({
        error: (err) => console.log('Error al cerrar sesion', err),
      });
  }
}
