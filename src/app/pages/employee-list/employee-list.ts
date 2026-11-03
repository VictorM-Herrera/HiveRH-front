import { Component, inject, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee/employee.model';

@Component({
  selector: 'app-employee-list',
  imports: [],
  templateUrl: './employee-list.html',
  styleUrls: [
    './employee-list.css', 
    '../home/employee-home/employee-home.css',
    '../home/admin-home/admin-home.css',]
})
export class EmployeeList {
  private readonly employeeService = inject(EmployeeService)
  private readonly _employees = signal<Employee[]>([])
  readonly employee = this._employees.asReadonly();


  constructor(){
    if(this._employees.length === 0) {
      
    }
  }


}
