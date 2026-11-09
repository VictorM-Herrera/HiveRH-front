import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, concatMap, finalize, map, of } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { Account } from '../../models/auth.models';
import { Employee, EmployeeGenre, EmployeeStatus } from '../../models/employee/employee.model';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';

export interface EmployeeEditResult {
  employee: Employee;
  roleUpdated: boolean;
  roleError?: string;
}

@Component({
  selector: 'app-employee-edit',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './employee-edit.html',
  styleUrl: './employee-edit.css',
})
export class EmployeeEdit implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly employee = input.required<Employee>();
  readonly saved = output<EmployeeEditResult>();
  readonly closed = output<void>();
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentRole = signal<Account['rol'] | null>(null);
  readonly isLoadingRole = signal(true);
  readonly canAssignAdmin = computed(() => this.authService.roles().includes('ROLE_ADMIN'));
  readonly role = this.fb.control<Account['rol'] | ''>({ value: '', disabled: true });

  readonly form = this.fb.group({
    name: ['', Validators.required],
    lastName: ['', Validators.required],
    dni: ['', Validators.required],
    genre: ['OTHER' as EmployeeGenre, Validators.required],
    birth_date: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
    hire_date: ['', Validators.required],
    termination_date: [''],
    base_salary: [0, [Validators.required, Validators.min(0.01)]],
    status: ['ACTIVE' as EmployeeStatus, Validators.required],
  });

  ngOnInit(): void {
    const employee = this.employee();
    this.form.setValue({
      name: employee.name,
      lastName: employee.lastName,
      dni: employee.dni,
      genre: employee.genre,
      birth_date: employee.birthdate,
      phoneNumber: employee.phoneNumber,
      city: employee.city,
      address: employee.address,
      hire_date: employee.hireDate,
      termination_date: employee.terminationDate ?? '',
      base_salary: employee.baseSalary,
      status: employee.status,
    });

    this.accountService
      .getAccountByDni(employee.dni)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingRole.set(false)),
      )
      .subscribe((account) => {
        if (!account) return;
        this.currentRole.set(account.rol);
        this.role.setValue(account.rol);
        this.role.enable();
      });
  }

  close(): void {
    if (!this.isSaving()) this.closed.emit();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving() || this.isLoadingRole()) return;
    const values = this.form.getRawValue();
    const originalDni = this.employee().dni;
    const role = this.role.value;
    const roleChanged = role !== '' && role !== this.currentRole();
    if (
      roleChanged &&
      values.dni !== originalDni &&
      this.authService.session()?.identifier === originalDni
    ) {
      this.error.set('Guardá primero tu DNI y volvé a iniciar sesión para cambiar tu rol.');
      return;
    }

    this.error.set(null);
    this.isSaving.set(true);
    this.employeeService
      .updateEmployee(originalDni, {
        ...values,
        termination_date: values.termination_date || undefined,
      })
      .pipe(
        concatMap((employee) => {
          if (!roleChanged) return of({ employee, roleUpdated: false });

          return this.accountService.updateRole(employee.dni, role).pipe(
            map(() => ({ employee, roleUpdated: true })),
            catchError((error: HttpErrorResponse) =>
              of({
                employee,
                roleUpdated: false,
                roleError: error.error?.detail || 'Volvé a abrir la edición para reintentar.',
              }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (result) => this.saved.emit(result),
        error: () =>
          this.error.set('No pudimos guardar los cambios. Revisá los datos e intentá nuevamente.'),
      });
  }
}
