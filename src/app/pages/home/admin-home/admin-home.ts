import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { BranchService } from '../../../services/branch.service';
import { Branch } from '../../../models/branch';
import { Department } from '../../../models/department';
import { DepartmentService } from '../../../services/department.service';
import { Position } from '../../../models/position';
import { PositionService } from '../../../services/position.service';
import { HiveCarousel, HiveCarouselItem } from '../../../shared/hive-carousel/hive-carousel';
import { routes } from '../../../app.routes';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.html',
  styleUrls: ['./admin-home.css', '../employee-home/employee-home.css'],
  imports: [HiveCarousel, RouterLink],
})
export class AdminHome {
  readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  private readonly branchService = inject(BranchService);
  private readonly departmentService = inject(DepartmentService);
  private readonly positionService = inject(PositionService);

  private readonly _branches = signal<Branch[]>([]);
  readonly branches = this._branches.asReadonly();

  private readonly _departments = signal<Department[]>([]);
  readonly departments = this._departments.asReadonly();

  private readonly _positions = signal<Position[]>([]);
  readonly positions = this._positions.asReadonly();

  readonly hiveItems: readonly HiveCarouselItem[] = [
    {
      id: 'Sucursales',
      route: '',
      label: 'Gestion de sucursales',
      description: 'CRUD Sucursales',
      icon: 'icons/navigation/building.svg'
    },
    {
      id: 'Departamentos',
      route: '',
      label: 'Gestion de departamentos',
      description: 'CRUD Departamentos',
      icon: 'icons/navigation/grid.svg'
    },
    {
      id: 'Puestos',
      route: '',
      label: 'Gestion de puestos',
      description: 'CRUD Puestos',
      icon: 'icons/navigation/briefcase.svg'
    }
  ]
  

  constructor(){

    if(this._branches().length === 0) {
      this.branchService.getBranches().subscribe({
        next: branchArr => this._branches.set(branchArr),
        error: err => console.log("Error al cargar branches", err)
      })
    }  
    
   
    if(this._departments().length === 0){ this.departmentService.getDepartments().subscribe({
      next: deps => this._departments.set(deps),
      error: err => console.log("Error al cargar departamentos", err)
    }) }

  
    if(this._positions().length === 0) this.positionService.getPositions().subscribe({
      next: pos => this._positions.set(pos),
      error: err => console.log("Error al cargar puestos", err)
    })
  }
  

  openSection(item: HiveCarouselItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }
  }

  navigate(path:string){
    this.router.navigate([path]);  
  }
}
