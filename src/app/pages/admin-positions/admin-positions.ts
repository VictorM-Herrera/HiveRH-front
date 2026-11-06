import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { validate } from '@angular/forms/signals';
import { PositionService } from '../../services/position.service';
import { Position } from '../../models/position';

@Component({
  selector: 'app-admin-positions',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-positions.html',
  styleUrl: './admin-positions.css',
})
export class AdminPositions {
  private readonly positionService = inject(PositionService);
  private readonly _positions = signal<Position[]>([]);
  readonly position = this._positions.asReadonly();

  form = new FormGroup({
    createForm: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(4)
      ],
      nonNullable: true
    })
  })

  createPosition() {
    this.positionService.postPosition(this.form.getRawValue().createForm)
      .subscribe({
        next: data => console.log("OK", data),
        error: err => console.log("error al crear position", err)
      })
  }

  constructor() {
    if (this._positions.length === 0) {
      this.positionService.getPositions().subscribe({
        next: data => this._positions.set(data),
        error: err => console.log("Error al cargar posiciones", err)
      })
    }
  }

}
