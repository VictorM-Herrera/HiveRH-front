import { Component, inject, signal } from '@angular/core';
import { FormControl, FormControlName, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { email } from '@angular/forms/signals';
import { AuthService, loginDTO } from '../../services/auth.service';
import { finalize, map, switchMap } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent } from '../../components/toast/toast';

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
    identifier: ['',[Validators.required]],
    password: ['',[Validators.required]]
  })


  login(){
    const {identifier, password} = this.loginForm.getRawValue();
    this.error.set(null);
    this.isLoading.set(true);

    const dto: loginDTO = {
      identifier: identifier,
      password: password
    }

    this.authService.login(dto)
    .pipe(finalize(()=>this.isLoading.set(false)))
    .subscribe({
      next:(data)=>{
        if (data){
          this._router.navigate(['home'])
        } else{
          this.error.set("credenciales invalidas")
        }
      },
      error: err => this.error.set('No pudimos iniciar sesión. Intentá nuevamente.')
    });
  }
}
