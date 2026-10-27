import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-circle',
  templateUrl: './loading-circle.html',
  styleUrl: './loading-circle.css',
})
export class LoadingCircleComponent {
  readonly message = input('Cargando...');
}
