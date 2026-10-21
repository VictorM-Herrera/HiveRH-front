import { Component, inject, signal } from '@angular/core';
import { FormControl, FormControlName, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { email } from '@angular/forms/signals';
import { AuthService, loginDTO } from '../../services/auth.service';
import { map, switchMap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly _router = inject(Router);
  readonly error = signal<string | null>(null);
  
  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: Validators.email
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: Validators.minLength(4)
    })
  })


  login(){
    const email = this.loginForm.getRawValue().email;
    const password = this.loginForm.getRawValue().password;

    const dto: loginDTO = {
      identifier: email,
      password: password
    }

    this.authService.login(dto).subscribe({
      next:(data)=>{
        if (data){
          this._router.navigate(['/home'])
        } else{
          this.error.set("credenciales invalidas")
        }
      },
      error: err => console.error(err)
    });
  }
}
