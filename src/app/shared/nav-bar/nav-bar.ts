import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'nav-bar',
  imports: [],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  readonly router = inject(Router);

  home(){
    this.router.navigate(['/'])
  }
}
