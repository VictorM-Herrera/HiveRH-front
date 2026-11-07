import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { Branch } from '../../models/branch.model';
import { BranchService } from '../../services/branch.service';

const cityPattern = /^[\p{L}0-9]+(?:[ .,'-][\p{L}0-9]+)*$/u;

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim();
}

@Component({
  selector: 'app-admin-branches',
  imports: [ReactiveFormsModule, ToastComponent],
  templateUrl: './admin-branches.html',
  styleUrls: ['../team-licenses/team-licenses.css', './admin-branches.css'],
})
export class AdminBranches {
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _branches = signal<Branch[]>([]);

  readonly branches = this._branches.asReadonly();
  readonly search = this.fb.control('');
  private readonly searchTerm = toSignal(this.search.valueChanges, { initialValue: '' });
  readonly visibleBranches = computed(() => {
    const term = normalizeSearch(this.searchTerm());
    return this.branches().filter((branch) =>
      normalizeSearch(`${branch.name} ${branch.city}`).includes(term),
    );
  });

  readonly formBranch = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(cityPattern)]],
    address: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  });
  readonly editingBranch = signal<Branch | null>(null);
  readonly pendingDeactivation = signal<Branch | null>(null);
  readonly isLoading = signal(false);
  readonly loadError = signal(false);
  readonly isSaving = signal(false);
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);

  constructor() {
    this.loadBranches();
  }

  loadBranches(): void {
    if (this.isLoading() || this.isSaving()) return;
    this.isLoading.set(true);
    this.loadError.set(false);
    this.branchService
      .getBranches()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (branches) => this._branches.set(branches),
        error: () => this.loadError.set(true),
      });
  }

  editBranch(branch: Branch): void {
    if (this.isSaving()) return;
    this.pendingDeactivation.set(null);
    this.editingBranch.set(branch);
    const { name, city, address } = branch;
    this.formBranch.reset({ name, city, address });
  }

  resetForm(): void {
    this.editingBranch.set(null);
    this.formBranch.reset({ name: '', city: '', address: '' });
  }

  saveBranch(): void {
    if (this.isSaving() || this.isLoading() || this.loadError()) return;
    const { name, city, address } = this.formBranch.getRawValue();
    const branch = { name: name.trim(), city: city.trim(), address: address.trim() };
    this.formBranch.setValue(branch);
    this.formBranch.markAllAsTouched();
    if (this.formBranch.invalid) return;

    const editing = this.editingBranch();
    const save$ = editing
      ? this.branchService.updateBranch(editing.id_branch, branch)
      : this.branchService.postBranch(branch);
    this.isSaving.set(true);
    save$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (saved) => {
          this._branches.update((branches) => {
            const updated = editing
              ? branches.map((item) => (item.id_branch === saved.id_branch ? saved : item))
              : [...branches, saved];
            return updated.filter((item) => item.active);
          });
          this.resetForm();
          this.notify('success', editing ? 'Sucursal actualizada.' : 'Sucursal creada.');
        },
        error: () => this.notify('error', 'No pudimos guardar la sucursal. Intentá nuevamente.'),
      });
  }

  deactivateBranch(): void {
    const branch = this.pendingDeactivation();
    if (!branch || this.isSaving()) return;
    this.isSaving.set(true);
    this.branchService
      .deleteBranch(branch.id_branch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (deactivated) => {
          this._branches.update((branches) =>
            branches.filter((item) => item.id_branch !== deactivated.id_branch),
          );
          this.pendingDeactivation.set(null);
          if (this.editingBranch()?.id_branch === deactivated.id_branch) this.resetForm();
          this.notify('success', 'Sucursal dada de baja.');
        },
        error: () =>
          this.notify('error', 'No pudimos dar de baja la sucursal. Intentá nuevamente.'),
      });
  }

  private notify(type: ToastType, message: string): void {
    this.toast.set({
      type,
      title: type === 'success' ? 'Sucursales' : 'No se pudo completar la acción',
      message,
    });
  }
}
