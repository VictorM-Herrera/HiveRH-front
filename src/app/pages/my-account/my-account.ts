import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, defer, finalize, of, switchMap, tap, throwError } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-account',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './my-account.html',
  styleUrl: './my-account.css',
})
export class MyAccount {
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentEmail = this.accountService.email;

  readonly accountForm = this.fb.group({
    email: ['', [Validators.email]],
    currentPassword: [''],
    newPassword: [''],
  });

  submitChanges(): void {
    if (this.isLoading()) return;
    const { currentPassword, newPassword } = this.accountForm.getRawValue();
    
    let email = this.accountForm.controls.email.value.trim();
    this.accountForm.controls.email.setValue(email);
    this.accountForm.markAllAsTouched();

    if (email === this.currentEmail()) email = '';
    if (this.accountForm.invalid || (!email && !newPassword)) return;
    if (newPassword && !currentPassword.trim()) {
      this.error.set('Ingresá tu contraseña actual para cambiarla.');
      return;
    }

    let passwordSaved = false;
    this.error.set(null);
    this.isLoading.set(true);

    defer(() =>
      newPassword
        ? this.accountService.updatePassword(currentPassword, newPassword).pipe(
            tap(() => {
              passwordSaved = true;
            }),
          )
        : of(null),
    )
      .pipe(
        switchMap(() => (email ? this.accountService.updateEmail(email) : of(null))),
        catchError((error: unknown) => (passwordSaved ? of(null) : throwError(() => error))),
        switchMap(() =>
          this.authService.logout().pipe(
            catchError(() => of(void 0)),
            finalize(() => {
              this.router.navigate(['/'], {
                replaceUrl: true,
                state: { accountUpdateMessage: 'Actualizamos tus datos de la cuenta.' },
              });
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        error: () => this.error.set('No pudimos actualizar tu cuenta. Intentá nuevamente.'),
      });
  }
}
