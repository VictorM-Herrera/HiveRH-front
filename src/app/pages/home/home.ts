import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AdminHome } from './admin-home/admin-home';
import { EmployeeHome } from './employee-home/employee-home';
import { StaffHome } from './staff-home/staff-home';

@Component({
  selector: 'app-home',
  imports: [AdminHome, EmployeeHome, StaffHome],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly authService = inject(AuthService);

  readonly homeRole = computed(() => {
    const roles = this.authService.roles();
    if (roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (roles.includes('ROLE_STAFF')) return 'STAFF';
    return 'EMPLOYEE';
  });
}
