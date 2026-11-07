import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { Branch } from '../../models/branch.model';
import { Department } from '../../models/department.model';
import { Employee, EmployeeGenre } from '../../models/employee/employee.model';
import { Position } from '../../models/position.model';
import { BranchService } from '../../services/branch.service';
import { DepartmentService } from '../../services/department.service';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';
import { todayDate } from '../my-vacations/vacation-dates';

@Component({
  selector: 'app-employee-create',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './employee-create.html',
  styleUrl: '../employee-edit/employee-edit.css',
})
export class EmployeeCreate {
  private readonly employeeService = inject(EmployeeService);
  private readonly branchService = inject(BranchService);
  private readonly positionService = inject(PositionService);
  private readonly departmentService = inject(DepartmentService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly saved = output<Employee>();
  readonly closed = output<void>();
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly optionsError = signal(false);
  readonly options = signal<{
    branches: Branch[];
    positions: Position[];
    departments: Department[];
  } | null>(null);
  readonly today = todayDate();

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
      lastName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      genre: ['OTHER' as EmployeeGenre, Validators.required],
      birth_date: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      city: ['', [Validators.required, Validators.pattern(/\S/)]],
      address: ['', [Validators.required, Validators.pattern(/\S/)]],
      hire_date: ['', Validators.required],
      base_salary: [0, [Validators.required, Validators.min(0.01)]],
      id_branch: [0, [Validators.required, Validators.min(1)]],
      id_position: [0, [Validators.required, Validators.min(1)]],
      id_department: [0, [Validators.required, Validators.min(1)]],
    },
    {
      validators: (form) => {
        const { birth_date, hire_date } = form.getRawValue();
        const eighteenthBirthday = `${Number(birth_date.slice(0, 4)) + 18}${birth_date.slice(4)}`;
        if (birth_date && eighteenthBirthday > this.today) return { underage: true };
        return hire_date > this.today ? { futureHireDate: true } : null;
      },
    },
  );

  constructor() {
    this.loadOptions();
  }

  loadOptions(): void {
    this.optionsError.set(false);
    forkJoin({
      branches: this.branchService.getBranches(),
      positions: this.positionService.getPositions({ active: true }),
      departments: this.departmentService.getDepartments({ active: true }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => this.options.set(options),
        error: () => this.optionsError.set(true),
      });
  }

  close(): void {
    if (!this.isSaving()) this.closed.emit();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving() || !this.options()) return;
    const values = this.form.getRawValue();
    this.error.set(null);
    this.isSaving.set(true);
    this.employeeService
      .createEmployee({
        ...values,
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        city: values.city.trim(),
        address: values.address.trim(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (employee) => this.saved.emit(employee),
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.error?.detail ||
              'No pudimos dar de alta al empleado. Revisá los datos e intentá nuevamente.',
          ),
      });
  }
}
