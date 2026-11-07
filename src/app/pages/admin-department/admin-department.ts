import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DepartmentService } from '../../services/department.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentFilter } from '../../models/department-filter';
import { Department } from '../../models/department.model';
import { BehaviorSubject, catchError, of, startWith, switchMap } from 'rxjs';

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
  private readonly filters = new BehaviorSubject<DepartmentFilter>({});

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

  readonly listResult = toSignal(
    this.filters.pipe(
      switchMap((filters) =>
        this.departmentService.getDepartments(filters).pipe(
          catchError(() => of('error' as const)),
          startWith(null),
        ),
      ),
    ),
    { initialValue: null },
  );

  applyFilters(): void {
    if (this.filterForm.invalid) return;
    const { name, active } = this.filterForm.getRawValue();
    this.filters.next({ name: name.trim() || undefined, active: active ?? undefined });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadDepartments(): void {
    this.filters.next(this.filters.value);
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

  changeStatus(id: number, status: boolean): void {
    this.departmentService.patchDeparment(id, !status).subscribe({
      next: () => this.loadDepartments(),
      error: (err) => console.log('error en el patch', err),
    });
  }
}
