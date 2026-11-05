import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { ToastComponent } from '../../../components/toast/toast';
import { PageResponse } from '../../../models/page-response.models';
import { EmployeeService } from '../../../services/employee.service';
import { LicencesService } from '../../../services/licences.service';
import { VacationService } from '../../../services/vacation.service';
import { HiveCarousel, HiveCarouselItem } from '../../../shared/hive-carousel/hive-carousel';

const pendingPage = { status: 'PENDING', page: 0, size: 1 } as const;

@Component({
  selector: 'app-staff-home',
  imports: [HiveCarousel, RouterLink, ToastComponent],
  templateUrl: './staff-home.html',
  styleUrls: ['../employee-home/employee-home.css', './staff-home.css'],
})
export class StaffHome {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  readonly employeeName = computed(() => this.employeeService.currentEmployee()?.name ?? '');
  readonly pendingVacations = this.readTotal(inject(VacationService).getVacations(pendingPage));
  readonly pendingLicenses = this.readTotal(inject(LicencesService).getLicenses(pendingPage));
  readonly activeEmployees = this.readTotal(
    this.employeeService.getEmployees({ status: 'ACTIVE', page: 0, size: 1 }),
  );

  readonly pendingTotal = computed(() => {
    const vacations = this.pendingVacations();
    const licenses = this.pendingLicenses();
    return vacations == null || licenses == null ? null : vacations + licenses;
  });

  readonly managementItems = computed<readonly HiveCarouselItem[]>(() => [
    {
      id: 'vacations',
      label: 'Vacaciones',
      description: this.pendingDescription(this.pendingVacations()),
      icon: 'icons/navigation/calendar.svg',
    },
    {
      id: 'licenses',
      label: 'Licencias',
      description: this.pendingDescription(this.pendingLicenses()),
      icon: 'icons/navigation/file.svg',
      route: '/team-licenses',
    },
    {
      id: 'employees',
      label: 'Empleados',
      description: 'Gestionar el equipo',
      icon: 'icons/navigation/people.svg',
    },
  ]);

  readonly personalItems = [
    {
      route: '/my-vacations',
      label: 'Mis vacaciones',
      description: 'Solicitudes propias',
      icon: 'icons/navigation/sun.svg',
    },
    {
      route: '/my-licenses',
      label: 'Mis licencias',
      description: 'Mis certificados',
      icon: 'icons/navigation/file.svg',
    },
    {
      route: '/profile',
      label: 'Mi perfil',
      description: 'Mis datos',
      icon: 'icons/navigation/profile.svg',
    },
  ];

  readonly notice = signal<string | null>(null);

  openManagement(item: HiveCarouselItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }
    this.notice.set(`La sección «${item.label}» estará disponible próximamente.`);
  }

  private readTotal(page$: Observable<PageResponse<unknown>>) {
    return toSignal(
      page$.pipe(
        map(({ totalElements }) => totalElements),
        catchError(() => of(null)),
      ),
    );
  }

  private pendingDescription(count: number | null | undefined): string {
    if (count === undefined) return 'Consultando solicitudes…';
    if (count === null) return 'Cantidad no disponible';
    return `${count} ${count === 1 ? 'solicitud' : 'solicitudes'} por revisar`;
  }
}
