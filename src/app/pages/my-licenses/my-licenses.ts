import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { concatMap, finalize, from, map, of, switchMap, tap, toArray } from 'rxjs';
import { LoadingCircleComponent } from '../../components/loading-circle/loading-circle';
import { ToastComponent, ToastType } from '../../components/toast/toast';
import { License } from '../../models/license.models';
import {
  dateRangeValidator,
  formatDate,
  formatPeriod,
  periodDays,
} from '../my-vacations/vacation-dates';
import { LicencesService } from '../../services/licences.service';

@Component({
  selector: 'app-my-licenses',
  imports: [ReactiveFormsModule, LoadingCircleComponent, ToastComponent],
  templateUrl: './my-licenses.html',
  styleUrls: [
    '../my-vacations/my-vacations.css',
    '../my-vacations/vacation-requests.css',
    './my-licenses.css',
  ],
})
export class MyLicenses implements OnInit {
  private readonly licences = inject(LicencesService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadedCertificates = signal(0);

  readonly form = this.fb.group(
    {
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      motive: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    },
    { validators: dateRangeValidator },
  );
  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly maxCertificates = 10;
  readonly files = signal<File[]>([]);
  readonly licenseId = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly isDownloading = signal(false);
  readonly isLoadingLicenses = signal(false);
  readonly page = signal(0);
  readonly licensesPage = this.licences.licensesPage;
  readonly licenses = this.licences.licenses;
  readonly toast = signal<{ type: ToastType; title: string; message: string } | null>(null);
  readonly status = signal<License['status'] | ''>('');
  readonly statusFilters = [
    { value: '', label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobadas' },
    { value: 'REJECTED', label: 'Rechazadas' },
  ] as const;
  readonly statusLabels: Record<License['status'], string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
  };
  readonly formatDate = formatDate;
  readonly formatPeriod = formatPeriod;
  readonly selectedPeriod = computed(() => {
    const { startDate, endDate } = this.formValues();
    if (!startDate || !endDate || endDate < startDate) return null;
    return { days: periodDays(startDate, endDate), label: formatPeriod(startDate, endDate) };
  });
  readonly certificateCount = computed(() => this.uploadedCertificates() + this.files().length);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.licences.clearLicenses());
    this.loadLicenses();
  }

  loadLicenses(page = 0): void {
    if (this.isLoadingLicenses()) return;
    this.page.set(page);
    this.licences.clearLicenses();
    this.isLoadingLicenses.set(true);
    this.licences
      .getMyLicenses({ page, size: 10, status: this.status() || undefined })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingLicenses.set(false)),
      )
      .subscribe({
        error: () => this.notify('error', 'No pudimos cargar tus solicitudes.'),
      });
  }

  selectStatus(status: License['status'] | ''): void {
    if (this.isLoadingLicenses() || this.isSubmitting()) return;
    this.status.set(status);
    this.loadLicenses();
  }

  addCertificates(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length || this.isSubmitting()) return;

    if (this.certificateCount() + files.length > this.maxCertificates) {
      this.notify('error', 'Podés adjuntar hasta 10 certificados por solicitud.');
      return;
    }
    if (
      files.some((file) => !/\.pdf$/i.test(file.name) || !file.size || file.size > 5 * 1024 * 1024)
    ) {
      this.notify('error', 'Elegí archivos PDF de hasta 5 MB.');
      return;
    }
    this.files.update((selected) => [...selected, ...files]);
  }

  removeCertificate(index: number): void {
    this.files.update((files) => files.filter((_, position) => position !== index));
  }

  submit(): void {
    const id = this.licenseId();
    this.form.markAllAsTouched();
    if (
      this.isSubmitting() ||
      this.isLoadingLicenses() ||
      (id === null ? this.form.invalid : !this.files().length)
    )
      return;

    const values = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.toast.set(null);
    this.form.disable();
    const licenseId$ =
      id === null
        ? this.licences.createLicense({ ...values, motive: values.motive.trim() }).pipe(
            tap((license) => {
              this.licenseId.set(license.id);
              this.uploadedCertificates.set(license.idCertificates.length);
              this.status.set('');
            }),
            map((license) => license.id),
          )
        : of(id);

    licenseId$
      .pipe(
        switchMap((licenseId) =>
          from(this.files()).pipe(
            concatMap((file) =>
              this.licences.uploadCertificate(licenseId, file).pipe(
                tap(() => {
                  this.uploadedCertificates.update((count) => count + 1);
                  this.files.update((files) => files.filter((item) => item !== file));
                }),
              ),
            ),
            toArray(),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting.set(false);
          if (this.licenseId() === null) this.form.enable();
        }),
      )
      .subscribe({
        next: () => {
          if (this.files().length) return;
          this.resetForm();
          this.notify('success', 'Tu solicitud quedó pendiente de revisión.');
          this.loadLicenses();
        },
        error: (error: unknown) => {
          if (this.licenseId() !== null) {
            this.notify(
              'error',
              'La licencia se guardó. Volvé a intentar los certificados pendientes.',
            );
            this.loadLicenses();
            return;
          }
          const detail = error instanceof HttpErrorResponse ? error.error?.detail : null;
          this.notify(
            'error',
            typeof detail === 'string'
              ? detail
              : 'No pudimos enviar la solicitud. Intentá nuevamente.',
          );
        },
      });
  }

  resetForm(): void {
    this.licenseId.set(null);
    this.uploadedCertificates.set(0);
    this.files.set([]);
    this.form.reset();
    this.form.enable();
  }

  downloadCertificate(id: number): void {
    if (this.isDownloading()) return;
    this.isDownloading.set(true);
    this.licences
      .downloadCertificate(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDownloading.set(false)),
      )
      .subscribe({
        next: (file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificado-${id}.pdf`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: () => this.notify('error', 'No pudimos descargar el certificado.'),
      });
  }

  private notify(type: ToastType, message: string): void {
    this.toast.set({
      type,
      title: type === 'success' ? 'Solicitud enviada' : 'No se pudo completar la acción',
      message,
    });
  }
}
