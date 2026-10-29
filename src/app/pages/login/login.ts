import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { defer, finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ToastComponent } from '../../components/toast/toast';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LoadingCircleComponent, ToastComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _fb = inject(NonNullableFormBuilder);
  readonly error = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly loginForm = this._fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  login() {
    if (this.loginForm.invalid || this.isLoading()) {
      return;
    }

    this.error.set(null);
    this.isLoading.set(true);

    
    defer(() => this.authService.login(this.loginForm.getRawValue()))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.mustChangePassword) {
            this._router.navigate(['/change-password']);
            return;
          }

          this._router.navigate(['/home']);
        },
        error: (error: unknown) => {
          this.error.set(
            error instanceof HttpErrorResponse && error.status === 401
              ? 'Credenciales inválidas.'
              : 'No pudimos iniciar sesión. Intentá nuevamente.',
          );
        },
      });
  }
}
