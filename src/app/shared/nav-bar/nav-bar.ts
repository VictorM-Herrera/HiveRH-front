import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';



interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css', './user-menu.css'],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeUserMenu()',
  },
})
export class NavBar {
  readonly userName = input('Mi cuenta');
  readonly userRole = input('Usuario');
  readonly userPhoto = input<string | null>(null);
  readonly itemSelected = output<string>();
  readonly profileSelected = output<void>();
  readonly logoutSelected = output<void>();
  readonly isUserMenuOpen = signal(false);

  private readonly userMenu = viewChild<ElementRef<HTMLElement>>('userMenu');

  readonly navigationItems: readonly NavigationItem[] = [
    { id: 'sun', label: 'Mis vacaciones', icon: 'sun'},
    { id: 'file', label: 'Mis licencias', icon: 'file' },
    { id: 'clock', label: 'Mi horario', icon: 'clock' },
    { id: 'profile', label: 'Mi Perfil', icon: 'profile-white' },
  ];
  readonly navigationItemsStaff: readonly NavigationItem[] = [
    { id: 'people', label: 'Empleados', icon: 'people'},
    { id: 'calendar', label: 'Vacaciones', icon: 'calendar' },
    { id: 'file', label: 'Licencias', icon: 'file' },
    { id: 'clock', label: 'Horarios', icon: 'clock' },
    

  ];
  readonly navigationItemsAdmin: readonly NavigationItem[] = [
    { id: 'building', label: 'Sucursales', icon: 'building' },
    { id: 'grid', label: 'Departamentos', icon: 'grid' },
    { id: 'briefcase', label: 'Puestos', icon: 'briefcase' }
  ];


  toggleUserMenu(): void {
    this.isUserMenuOpen.update((isOpen) => !isOpen);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  selectProfile(): void {
    this.closeUserMenu();
    this.profileSelected.emit();
  }

  selectLogout(): void {
    this.closeUserMenu();
    this.logoutSelected.emit();
  }

  onDocumentClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.userMenu()?.nativeElement.contains(event.target)) {
      this.closeUserMenu();
    }
  }
}
