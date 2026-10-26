import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CsrfService } from './services/csrf.service';
import { NavBar } from './shared/nav-bar/nav-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
