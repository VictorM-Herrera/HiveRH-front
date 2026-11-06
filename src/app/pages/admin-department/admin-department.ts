import { Component, inject, signal } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department';
import { PageResponse } from '../../models/page-response.models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DepartmentFilter } from '../../models/department-filter';

@Component({
  selector: 'app-admin-department',
  imports: [],
  templateUrl: './admin-department.html',
  styleUrl: './admin-department.css',
})
export class AdminDepartment {
  private readonly departmentService = inject(DepartmentService);
  private readonly _departments = signal<Department[]>([]);
  readonly departments = this._departments.asReadonly();


  formDepartment = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    }),
    active: new FormControl(true, {
      nonNullable: true
    })
  })

  nameDepto = new FormControl({
      validators: Validators.required,
      nonNullable: true
  })


  getDepartments() {
    const { name, active } = this.formDepartment.getRawValue();
    const filter: DepartmentFilter = {
      name: name,
      active: active
    }
    this.departmentService.getDepartments(filter).subscribe({
      next: data => this._departments.set(data),
      error: err => console.log("departamentos no encontrados", err)

    })
  }

  postDepartment() {
    const name = this.nameDepto.getRawValue.name;
    this.departmentService.postDepartment(name)
  }
}
