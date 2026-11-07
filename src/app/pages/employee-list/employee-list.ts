import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, of, startWith, switchMap } from 'rxjs';
import { EmployeeFilter } from '../../models/employee/employee-filter.model';
import { EmployeeAssignment, EmployeeStatus } from '../../models/employee/employee.model';
import { BranchService } from '../../services/branch.service';
import { DepartmentService } from '../../services/department.service';
import { EmployeeService } from '../../services/employee.service';
import { PositionService } from '../../services/position.service';

const firstPage = { page: 0, size: 10 };

@Component({
  selector: 'app-employee-list',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employee-list.html',
  styleUrls: ['../team-licenses/team-licenses.css', './employee-list.css'],
})
export class EmployeeList {
  private readonly employeeService = inject(EmployeeService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly query = new BehaviorSubject<EmployeeFilter>(firstPage);

  readonly isActiveAssignment = (assignment: EmployeeAssignment): boolean => assignment.active;
  readonly filterForm = this.fb.group(
    {
      fullName: '',
      dni: '',
      status: this.fb.control<EmployeeStatus | ''>(''),
      id_branch: this.fb.control<number | null>(null),
      department: '',
      position: '',
      hire_date: '',
      termination_date: '',
      min_salary: this.fb.control<number | null>(null),
      max_salary: this.fb.control<number | null>(null),
    },
    {
      validators: (form) => {
        const { min_salary, max_salary } = form.getRawValue();
        return min_salary != null && max_salary != null && min_salary > max_salary
          ? { salaryRange: true }
          : null;
      },
    },
  );

  readonly branches = toSignal(
    inject(BranchService)
      .getBranches()
      .pipe(catchError(() => of(null))),
  );
  readonly departments = toSignal(
    inject(DepartmentService)
      .getDepartments()
      .pipe(catchError(() => of(null))),
  );
  readonly positions = toSignal(
    inject(PositionService)
      .getPositions()
      .pipe(catchError(() => of(null))),
  );

  readonly listResult = toSignal(
    this.query.pipe(
      switchMap((filters) =>
        this.employeeService.getEmployees(filters).pipe(
          catchError(() => of('error' as const)),
          startWith(null),
        ),
      ),
    ),
    { initialValue: null },
  );

  applyFilters(): void {
    if (this.filterForm.invalid) return;
    const filters = this.filterForm.getRawValue();
    this.query.next({
      ...filters,
      ...firstPage,
      fullName: filters.fullName.trim(),
      dni: filters.dni.trim(),
      status: filters.status || undefined,
      id_branch: filters.id_branch ?? undefined,
      min_salary: filters.min_salary ?? undefined,
      max_salary: filters.max_salary ?? undefined,
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadPage(page = this.query.value.page ?? 0): void {
    this.query.next({ ...this.query.value, page });
  }
}
