import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DepartmentService } from '../../services/department.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentFilter } from '../../models/department-filter';
import { Department } from '../../models/department.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-department',
  imports: [ReactiveFormsModule],
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
  createDto = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
  });

  readonly listResult = signal<Department[] | 'error' | null>(null);
  readonly pendingStatusChange = signal<Department | null>(null);
  readonly isChangingStatus = signal(false);

  constructor() {
    this.loadDepartments();
  }

  applyFilters(): void {
    if (this.filterForm.invalid || this.isChangingStatus()) return;
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

  createDepartment(){
    const name = this.createDto.getRawValue().name.trim();
    if (!name) return;
    this.departmentService.postDepartment(name).subscribe({
      next: () => {
        this.createDto.reset();
        this.loadDepartments();
      },
      error: (err) => console.log('error al crear departamento', err),
    });
  }

  changeStatus(): void {
    const department = this.pendingStatusChange();
    if (!department?.id_department || this.isChangingStatus()) return;
    this.isChangingStatus.set(true);
    this.departmentService
      .patchDeparment(department.id_department, !department.active)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingStatus.set(false)),
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
