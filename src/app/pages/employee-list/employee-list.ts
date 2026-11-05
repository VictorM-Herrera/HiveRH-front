import { Component, inject, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee/employee.model';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { EmployeeFilter } from '../../models/employee/employee-filter.model';
import { validate } from '@angular/forms/signals';

@Component({
  selector: 'app-employee-list',
  imports: [ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './employee-list.html',
  styleUrls: [
    './employee-list.css', 
    '../home/employee-home/employee-home.css',
    '../home/admin-home/admin-home.css',]
})
export class EmployeeList {
  private readonly employeeService = inject(EmployeeService)
  private readonly _employees = signal<Employee[]>([])
  readonly employees = this._employees.asReadonly();
  employeeCount = signal<number>(0);

  filterForm = new FormGroup({
    filter: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    })
  })

  private filtroDefault: EmployeeFilter = {
    page: 0,
    size: 7,
  }


  constructor(){
    if(this._employees.length === 0) {
      this.employeeService.getEmployees(this.filtroDefault).subscribe({
        next: data => {
          console.log(data);
          
          this._employees.set(data.element)
        },
        error: err => console.error("Error al cargar paginacion de empleados", err)
      })
    }
    this.employeeService.getCountEMployees().subscribe({
      next: data => this.employeeCount.set(data.totalElements)
    })
  }

  filtrar(){
    const data = this.filterForm.getRawValue().filter;
    const filtro: EmployeeFilter = {
      dni: data
    }
    this.employeeService.getEmployees(filtro).subscribe({
      next: data => this._employees.set(data.element),
      error: ea => console.log(ea)
      
    })
  }
  nextPage(): void {
  this.filtroDefault.page = (this.filtroDefault.page ?? 0) + 1;

  this.employeeService.getEmployees(this.filtroDefault).subscribe({
    next: data => {
      const employees = data.element ?? [];

      if (employees.length === 0) {
        this.filtroDefault.page = Math.max(0, (this.filtroDefault.page ?? 0) - 1);
        return;
      }

      this._employees.set(employees);
    },
    error: err => console.error('Error al cargar empleados', err)
  });
}
  previousPage(){
  this.filtroDefault.page = (this.filtroDefault.page ?? 0) - 1;

  this.employeeService.getEmployees(this.filtroDefault).subscribe({
    next: data => {
      const employees = data.element ?? [];

      if (employees.length === 0) {
        this.filtroDefault.page = Math.max(0, (this.filtroDefault.page ?? 0) + 1);
        return;
      }

      this._employees.set(employees);
    },
    error: err => console.error('Error al cargar empleados', err)
  });
  }

 lastPage(): void {
  const total = this.employeeCount() ?? 0;
  const size = this.filtroDefault.size ?? 7;

  const lastPage = Math.max(0, Math.ceil(total / size) - 1);
  this.filtroDefault.page = lastPage;

  this.employeeService.getEmployees(this.filtroDefault).subscribe({
    next: data => this._employees.set(data.element ?? []),
    error: err => console.error('Error al cargar empleados', err)
  });
}
  beginPege(){
    this.filtroDefault.page = 0;
    this.employeeService.getEmployees(this.filtroDefault).subscribe({
        next: data => this._employees.set(data.element)
    })
  }





}
