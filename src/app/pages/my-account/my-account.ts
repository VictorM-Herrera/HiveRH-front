import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastComponent } from '../../components/toast/toast';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-account',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './my-account.html',
  styleUrl: './my-account.css',
})
export class MyAccount {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly showNotice = signal(false);
  readonly currentEmail = this.authService.email;

  readonly accountForm = this.fb.group({
    email: ['', [Validators.email]],
    password: ['',[Validators.min(4)]],
  });

  get hasChanges(): boolean {
    const { email, password } = this.accountForm.getRawValue();
    return email.trim().length > 0 || password.length > 0;
  }

  submitChanges(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid || !this.hasChanges) return;

    // TODO: enviar los valores de accountForm al endpoint de actualización.
    this.showNotice.set(true);
  }
}
