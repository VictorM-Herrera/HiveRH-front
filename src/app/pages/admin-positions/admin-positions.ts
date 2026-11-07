import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { Position, PositionFilters } from '../../models/position.model';
import { PositionService } from '../../services/position.service';

@Component({
  selector: 'app-admin-positions',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './admin-positions.html',
  styleUrls: [
    '../team-licenses/team-licenses.css',
    '../admin-branches/admin-branches.css',
    './admin-positions.css',
  ],
})
export class AdminPositions {
  private readonly positionService = inject(PositionService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private appliedFilters: PositionFilters = {};
  private listRequest?: Subscription;

  readonly filterForm = this.fb.group({
    name: ['', Validators.maxLength(100)],
    active: this.fb.control<boolean | null>(null),
  });
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  readonly listResult = signal<Position[] | 'error' | null>(null);
  readonly editingPosition = signal<Position | null>(null);
  readonly pendingStatusChange = signal<Position | null>(null);
  readonly isSaving = signal(false);
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);

  constructor() {
    this.loadPositions();
  }

  applyFilters(): void {
    if (this.isSaving() || this.filterForm.invalid) return;
    const { name, active } = this.filterForm.getRawValue();
    this.pendingStatusChange.set(null);
    this.appliedFilters = {
      name: name.trim() || undefined,
      active: active ?? undefined,
    };
    this.loadPositions();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  loadPositions(): void {
    this.listRequest?.unsubscribe();
    this.listResult.set(null);
    this.listRequest = this.positionService
      .getPositions(this.appliedFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (positions) => this.listResult.set(positions),
        error: () => this.listResult.set('error'),
      });
  }

  editPosition(position: Position): void {
    this.pendingStatusChange.set(null);
    this.editingPosition.set(position);
    this.form.reset({ name: position.name });
  }

  resetForm(): void {
    this.editingPosition.set(null);
    this.form.reset();
  }

  savePosition(): void {
    if (this.isSaving() || this.listResult() === null) return;
    const name = this.form.controls.name.value.trim();
    this.form.controls.name.setValue(name);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const editing = this.editingPosition();
    const request = editing
      ? this.positionService.updatePosition(editing.id_position, name)
      : this.positionService.postPosition(name);
    this.saveChange(request, editing ? 'Puesto actualizado.' : 'Puesto creado.', () =>
      this.resetForm(),
    );
  }

  changeStatus(): void {
    const position = this.pendingStatusChange();
    if (!position || this.isSaving()) return;

    const active = !position.active;
    this.saveChange(
      this.positionService.patchPosition(position.id_position, active),
      active ? 'Puesto reactivado.' : 'Puesto dado de baja.',
    );
  }

  private saveChange(request: Observable<Position>, message: string, onSuccess?: () => void): void {
    this.isSaving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => {
          onSuccess?.();
          this.pendingStatusChange.set(null);
          this.loadPositions();
          this.toast.set({ type: 'success', title: 'Puestos', message });
        },
        error: () =>
          this.toast.set({
            type: 'error',
            title: 'No se pudo completar la acción',
            message: 'No pudimos guardar el cambio. Intentá nuevamente.',
          }),
      });
  }

  
}
