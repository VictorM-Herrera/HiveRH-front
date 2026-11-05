import { ValidatorFn } from '@angular/forms';

export function todayDate(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
}

export function addBusinessDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  let added = 0;
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) added++;
  }
  return date.toISOString().slice(0, 10);
}

export const dateRangeValidator: ValidatorFn = (control) => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  return start && end && end < start ? { dateOrder: true } : null;
};

export function periodDays(start: string, end: string): number {
  return (
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatPeriod(start: string, end: string): string {
  if (start === end) return formatDate(start);
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${start.slice(8)} al ${formatDate(end)}`;
  }
  return `${formatDate(start)} al ${formatDate(end)}`;
}
