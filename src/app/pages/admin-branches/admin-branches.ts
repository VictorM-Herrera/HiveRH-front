import { Component, inject, signal } from '@angular/core';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models/branch';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-branches',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-branches.html',
  styleUrl: './admin-branches.css',
})
export class AdminBranches {
  private readonly branchService = inject(BranchService);

  private readonly _branches = signal<Branch[]>([]);
  readonly branches = this._branches.asReadonly();

  branchCount = signal<number>(0);

  constructor(){
    if(this._branches.length === 0){
      this.branchService.getBranches().subscribe({
        next: data => {
          this._branches.set(data)
          this.branchCount.set(data.length)
        },
        error: err => console.log("error al cargar branches", err)
      })
      
    }
  }

  formBranch = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    }),
    city: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    }),
    address: new FormControl('', {
      validators: Validators.required,
      nonNullable: true
    }),
  })


  createBranch(){
    const {name, city, address} = this.formBranch.getRawValue();
    const branch:Branch = {
      name: name,
      city: city,
      address: address,
      active: true
    }
    this.branchService.postBranch(branch).subscribe({
      next: data => console.log("Ok", data),
      error: err => console.log("Error post Branch", err)
    })
  }

  deleteBranch(id:number){
    this.branchService.deleteBranch(id).subscribe({
      next: data => console.log("Ok", data),
      error: err => console.log("Error delete Branch", err)
    })
  }

}
