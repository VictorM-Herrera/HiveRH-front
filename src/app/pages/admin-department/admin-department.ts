import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DepartmentService } from '../../services/department.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentFilter } from '../../models/department-filter';
import { Department } from '../../models/department.model';
import { finalize } from 'rxjs';
import { ToastComponent, ToastType } from '../../components/toast/toast';

@Component({
  selector: 'app-admin-department',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './admin-department.html',
  styleUrls: [
    '../team-licenses/team-licenses.css',
    '../admin-branches/admin-branches.css',
    '../admin-positions/admin-positions.css',
    './admin-department.css',
  ],
})
export class AdminDepartment {
  private readonly departmentService = inject(DepartmentService);
  private readonly destroyRef = inject(DestroyRef);
  private appliedFilters: DepartmentFilter = {};

  readonly filterForm = new FormGroup({
    name: new FormControl('', {
      validators: Validators.maxLength(100),
      nonNullable: true,
    }),
    active: new FormControl<boolean | null>(null),
  });
  readonly form = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(100)],
      nonNullable: true,
    }),
  });

  readonly listResult = signal<Department[] | 'error' | null>(null);
  readonly editingDepartment = signal<Department | null>(null);
  readonly pendingStatusChange = signal<Department | null>(null);
  readonly isSaving = signal(false);
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);

  constructor() {
    this.loadDepartments();
  }

  applyFilters(): void {
    if (this.filterForm.invalid || this.isSaving()) return;
    const { name, active } = this.filterForm.getRawValue();
    this.pendingStatusChange.set(null);
    this.appliedFilters = { name: name.trim() || undefined, active: active ?? undefined };
    this.loadDepartments();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadDepartments(): void {
    this.listResult.set(null);
    this.departmentService
      .getDepartments(this.appliedFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (departments) => this.listResult.set(departments),
        error: () => this.listResult.set('error'),
      });
  }

  editDepartment(department: Department): void {
    if (!department.id_department || this.isSaving()) return;
    this.pendingStatusChange.set(null);
    this.editingDepartment.set(department);
    this.form.reset({ name: department.name });
  }

  resetForm(): void {
    this.editingDepartment.set(null);
    this.form.reset();
  }

  saveDepartment(): void {
    if (this.isSaving() || this.listResult() === null) return;
    const name = this.form.controls.name.value.trim();
    this.form.controls.name.setValue(name);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const editing = this.editingDepartment();
    const request = editing?.id_department
      ? this.departmentService.putDepartment(editing.id_department, name)
      : this.departmentService.postDepartment(name);
    this.isSaving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.pendingStatusChange.set(null);
          this.loadDepartments();
          this.toast.set({
            type: 'success',
            title: 'Departamentos',
            message: editing ? 'Departamento actualizado.' : 'Departamento creado.',
          });
        },
        error: () =>
          this.toast.set({
            type: 'error',
            title: 'Departamentos',
            message: 'No pudimos guardar el departamento. Intentá nuevamente.',
          }),
      });
  }

  changeStatus(): void {
    const department = this.pendingStatusChange();
    if (!department?.id_department || this.isSaving()) return;
    this.isSaving.set(true);
    this.departmentService
      .patchDeparment(department.id_department, !department.active)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.pendingStatusChange.set(null);
          this.loadDepartments();
        },
        error: (err) => console.log('error en el patch', err),
      });
  }
}
