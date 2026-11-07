import { Component, inject, signal } from '@angular/core';
import { DepartmentService } from '../../services/department.service';

import { PageResponse } from '../../models/page-response.models';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentFilter } from '../../models/department-filter';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-admin-department',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-department.html',
  styleUrl: './admin-department.css',
})
export class AdminDepartment {
  private readonly departmentService = inject(DepartmentService);
  private readonly _departments = signal<Department[]>([]);
  readonly departments = this._departments.asReadonly();

  constructor(){
    if(this._departments().length === 0){
      this.departmentService.getDepartments().subscribe({
        next: data => this._departments.set(data),
        error: err => console.error("error get departments", err)    
      })
    }
  }

  formDepartment = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    }),
  })

  nameDepto = new FormControl({
      validators: Validators.required,
      nonNullable: true
  })


  getDepartments() {
    const { name } = this.formDepartment.getRawValue();
    const filter: DepartmentFilter = {
      name: name
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

  putDepartment(){

  }


}
