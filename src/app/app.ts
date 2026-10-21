import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CsrfService } from './services/csrf.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
