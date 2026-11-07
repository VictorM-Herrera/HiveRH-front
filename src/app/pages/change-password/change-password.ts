import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './change-password.html',
  styleUrls: ['../login/login.css', './change-password.css'],
})
export class ChangePassword {
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(72),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]*$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (form) => {
        const { currentPassword, newPassword, confirmPassword } = form.getRawValue();
        if (newPassword && newPassword === currentPassword) return { samePassword: true };
        return confirmPassword && newPassword !== confirmPassword
          ? { passwordMismatch: true }
          : null;
      },
    },
  );

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isLoading()) return;
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.error.set(null);
    this.isLoading.set(true);
    this.accountService
      .updatePassword(currentPassword, newPassword)
      .pipe(
        switchMap(() =>
          this.authService.logout().pipe(
            catchError(() => of(void 0)),
            finalize(() => {
              this.router.navigate(['/'], {
                replaceUrl: true,
                state: {
                  accountUpdateMessage:
                    'Actualizamos tu contraseña. Volvé a ingresar con la nueva.',
                },
              });
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.error?.detail || 'No pudimos cambiar tu contraseña. Intentá nuevamente.',
          ),
      });
  }
}
