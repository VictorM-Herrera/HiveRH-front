import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { LoadingCircleComponent } from '../../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../../components/toast/toast';
import { Employee, EmployeeGenre, EmployeeStatus } from '../../../models/employee/employee.model';
import { EmployeeService } from '../../../services/employee.service';

@Component({
  selector: 'app-employee-edit',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './employee-edit.html',
  styleUrl: './employee-edit.css',
})
export class EmployeeEdit implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly employee = input.required<Employee>();
  readonly saved = output<Employee>();
  readonly closed = output<void>();
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  
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
  }

  close(): void {
    if (!this.isSaving()) this.closed.emit();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving()) return;
    const values = this.form.getRawValue();
    this.error.set(null);
    this.isSaving.set(true);
    this.employeeService
      .updateEmployee(this.employee().dni, {
        ...values,
        termination_date: values.termination_date || undefined,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (employee) => this.saved.emit(employee),
        error: () =>
          this.error.set('No pudimos guardar los cambios. Revisá los datos e intentá nuevamente.'),
      });
  }
}
