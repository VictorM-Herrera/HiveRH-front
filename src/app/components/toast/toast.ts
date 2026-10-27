import { Component, input, output } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly message = input.required<string>();
  readonly title = input('Ocurrió un error');
  readonly type = input<ToastType>('error');
  readonly dismissed = output<void>();
}
