import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { Employee } from '../../models/employee/employee.model';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeEdit } from './employee-edit/employee-edit';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, EmployeeEdit, LoadingCircleComponent, ToastComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css', './profile-details.css'],
})
export class Profile {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly selectedPicture = signal<string | null>(null);

  readonly employee = signal<Employee | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isEditing = signal(false);
  readonly toast = signal<{ type: ToastType; message: string; title: string } | null>(null);
  readonly isOwnProfile = computed(
    () => !!this.employee() && this.employee()?.dni === this.employeeService.currentEmployee()?.dni,
  );
  readonly canEdit = computed(() =>
    this.authService.roles().some((role) => role === 'ROLE_STAFF' || role === 'ROLE_ADMIN'),
  );
  readonly profilePicture = computed(() =>
    this.isOwnProfile() ? this.employeeService.profilePicture() : this.selectedPicture(),
  );
  readonly activeAssignment = computed(() =>
    this.employee()?.assignments.find((item) => item.active),
  );
  readonly genreLabels = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
    OTHER: 'Otro',
    NON_BINARY: 'No binario',
  };

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.loadProfile(params.get('dni'))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.destroyRef.onDestroy(() => this.clearSelectedPicture());
  }

  private loadProfile(dni: string | null) {
    this.employee.set(null);
    this.isEditing.set(false);
    this.clearSelectedPicture();
    this.isLoading.set(true);
    const current = this.employeeService.currentEmployee();
    const employee$ = dni
      ? this.employeeService.getEmployee(dni)
      : current
        ? of(current)
        : this.employeeService.loadCurrentEmployee();

    return employee$.pipe(
      tap((employee) => this.employee.set(employee)),
      switchMap((employee) => {
        if (!employee) return of(null);
        if (this.isOwnProfile()) return this.employeeService.loadProfilePicture(employee.dni);
        return this.employeeService.getProfilePicture(employee.dni).pipe(
          map((blob) => (blob.size ? URL.createObjectURL(blob) : null)),
          tap((url) => this.selectedPicture.set(url)),
          catchError(() => of(null)),
        );
      }),
      catchError(() => {
        this.showToast('error', 'No pudimos cargar el perfil. Intentá nuevamente.');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  onEmployeeSaved(employee: Employee): void {
    this.employee.set(employee);
    this.isEditing.set(false);
    this.showToast('success', 'Actualizamos los datos del empleado.');
    const dni = this.route.snapshot.paramMap.get('dni');
    if (dni && dni !== employee.dni) {
      this.router.navigate(['/profile', employee.dni], { replaceUrl: true });
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const employee = this.employee();
    if (!file || !employee || this.isSaving()) return;
    if (
      !['image/jpeg', 'image/png'].includes(file.type) ||
      !file.size ||
      file.size > 2 * 1024 * 1024
    ) {
      this.showToast('error', 'Elegí una foto JPG o PNG de hasta 2 MB.');
      return;
    }
    this.isSaving.set(true);
    this.employeeService
      .updateProfilePicture(employee.dni, file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => this.showToast('success', 'Actualizamos tu foto de perfil.'),
        error: () => this.showToast('error', 'No pudimos actualizar la foto. Intentá nuevamente.'),
      });
  }

  private clearSelectedPicture(): void {
    const url = this.selectedPicture();
    if (url) URL.revokeObjectURL(url);
    this.selectedPicture.set(null);
  }

  formatSalary(value: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  }

  private showToast(type: ToastType, message: string): void {
    this.toast.set({
      type,
      message,
      title: type === 'success' ? 'Cambios guardados' : 'Ocurrió un error',
    });
  }
}
