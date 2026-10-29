import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavigationIcon = 'home' | 'people' | 'calendar' | 'requests';

interface NavigationItem {
  id: string;
  label: string;
  icon: NavigationIcon;
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
  readonly itemSelected = output<string>();
  readonly profileSelected = output<void>();
  readonly logoutSelected = output<void>();
  readonly isUserMenuOpen = signal(false);

  private readonly userMenu = viewChild<ElementRef<HTMLElement>>('userMenu');

  readonly navigationItems: readonly NavigationItem[] = [
    { id: 'home', label: 'Inicio', icon: 'home', route: '/home' },
    { id: 'people', label: 'Personas', icon: 'people' },
    { id: 'calendar', label: 'Calendario', icon: 'calendar' },
    { id: 'requests', label: 'Solicitudes', icon: 'requests' },
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
