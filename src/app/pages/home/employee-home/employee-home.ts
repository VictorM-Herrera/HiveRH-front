import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastComponent } from '../../../components/toast/toast';
import { EmployeeService } from '../../../services/employee.service';
import { HiveCarousel, HiveCarouselItem } from '../../../shared/hive-carousel/hive-carousel';
import { EmployeeHomeRequest } from '../../../models/employee-home.models';

@Component({
  selector: 'app-employee-home',
  imports: [HiveCarousel, ToastComponent],
  templateUrl: './employee-home.html',
  styleUrl: './employee-home.css',
})
export class EmployeeHome {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());

  readonly requests = input<readonly EmployeeHomeRequest[]>([]);
  readonly employeeName = computed(() => this.employeeService.currentEmployee()?.name ?? '');
  readonly showAllRequests = signal(false);
  readonly notice = signal<string | null>(null);

  readonly pendingCount = computed(
    () => this.requests().filter((request) => request.status === 'PENDING').length,
  );

  readonly nextRequest = computed(
    () => this.requests()
      .filter(
        (request) =>
          (request.status === 'PENDING' || request.status === 'APPROVED') &&
          request.startDate >= this.today,
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null,
  );

  readonly upcomingTitle = computed(
    () => this.nextRequest()?.type === 'LEAVE' ? 'Próxima licencia' : 'Próximas vacaciones',
  );

  readonly latestRequests = computed(() => {
    const sorted = [...this.requests()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return this.showAllRequests() ? sorted : sorted.slice(0, 3);
  });

  readonly statusLabels = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
  };

  readonly hiveItems: readonly HiveCarouselItem[] = [
    {
      id: 'vacations',
      route: '/my-vacations',
      label: 'Mis vacaciones',
      description: 'Solicitar y consultar',
      icon: 'icons/navigation/sun.svg',
    },
    {
      id: 'leaves',
      route: '/my-licenses',
      label: 'Mis licencias',
      description: 'Licencias y certificados',
      icon: 'icons/navigation/file.svg',
    },
    {
      id: 'profile',
      route: '/profile',
      label: 'Mi perfil',
      description: 'Mis datos personales',
      icon: 'icons/navigation/profile.svg',
    },
  ];

  formatDate(value: string, includeYear = false): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      ...(includeYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    }).format(new Date(`${value}T12:00:00Z`));
  }

  formatDateRange(request: EmployeeHomeRequest): string {
    return `${this.formatDate(request.startDate, true)} al ${this.formatDate(request.endDate, true)}`;
  }

  toggleAllRequests(): void {
    this.showAllRequests.update((value) => !value);
  }

  openSection(item: HiveCarouselItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }
    this.notice.set(`La sección «${item.label}» estará disponible próximamente.`);
  }
}
