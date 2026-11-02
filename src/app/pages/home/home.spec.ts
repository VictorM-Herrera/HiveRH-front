import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Role } from '../../models/auth.models';
import { EmployeeHomeRequest } from '../../models/employee-home.models';
import { PageResponse } from '../../models/page-response.models';
import { Vacation } from '../../models/vacation.models';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { HiveCarousel, HiveCarouselItem } from '../../shared/hive-carousel/hive-carousel';
import { EmployeeHome } from './employee-home/employee-home';
import { Home } from './home';

describe('Employee home', () => {
  let employee = signal<{ name: string } | null>(null);
  let roles = signal<Role[]>(['ROLE_EMPLOYEE']);
  const vacationsUrl = `${environment.baseUrl}/api/vacations/me`;
  const vacation = (id: number, overrides: Partial<Vacation> = {}): Vacation => ({
    idVacation: id,
    requestDate: `2026-10-2${id}`,
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    status: 'PENDING',
    dniEmployee: '12345678',
    employeeName: 'Lucía Fernández',
    reviewedByAccountId: null,
    reviewComment: null,
    ...overrides,
  });
  const page = (
    element: Vacation[],
    index = 0,
    total = element.length,
  ): PageResponse<Vacation> => ({
    element,
    page: index,
    size: 2,
    totalElements: total,
    totalPages: Math.ceil(total / 2),
  });
  const listRequest = () =>
    TestBed.inject(HttpTestingController).expectOne(
      (request) => request.method === 'GET' && request.url === vacationsUrl,
    );

  const request = (overrides: Partial<EmployeeHomeRequest> = {}): EmployeeHomeRequest => ({
    id: 1,
    type: 'VACATION',
    status: 'APPROVED',
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    submittedAt: '2026-10-20T12:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T15:00:00Z'));
    employee = signal<{ name: string } | null>(null);
    roles = signal<Role[]>(['ROLE_EMPLOYEE']);
    TestBed.configureTestingModule({
      imports: [Home, EmployeeHome, HiveCarousel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { roles: roles.asReadonly() } },
        { provide: EmployeeService, useValue: { currentEmployee: employee.asReadonly() } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
  });

  it('updates the greeting when the employee loads and shows empty request states', () => {
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Hola.');

    employee.set({ name: 'Lucía' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Hola, Lucía.');
    expect(fixture.nativeElement.textContent).toContain(
      'Todavía no pediste vacaciones ni licencias.',
    );
    expect(fixture.nativeElement.textContent).toContain('Todavía no hiciste solicitudes');
    expect(fixture.nativeElement.textContent).not.toMatch(/jornada|horario/i);
  });

  it('shows the earliest upcoming leave, skipping past and rejected requests', () => {
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.componentRef.setInput('requests', [
      request(),
      request({ id: 2, type: 'LEAVE', startDate: '2026-11-02', status: 'PENDING' }),
      request({ id: 3, startDate: '2026-11-01', status: 'REJECTED' }),
      request({ id: 4, startDate: '2026-10-15' }),
      request({ id: 5, startDate: '2026-11-20', status: 'PENDING' }),
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.nextRequest()?.id).toBe(2);
    expect(fixture.componentInstance.upcomingTitle()).toBe('Próxima licencia');
    expect(fixture.nativeElement.textContent).toContain('2 solicitudes');
    expect(fixture.nativeElement.textContent).toContain('Pendiente');
  });

  it('uses the vacation heading for an upcoming vacation', () => {
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.componentRef.setInput('requests', [request()]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upcomingTitle()).toBe('Próximas vacaciones');
    expect(fixture.componentInstance.nextRequest()?.id).toBe(1);
  });

  it('sorts recent requests by submission and expands the list with Ver todas', () => {
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.componentRef.setInput(
      'requests',
      [1, 4, 2, 3].map((id) =>
        request({
          id,
          submittedAt: `2026-10-2${id}T12:00:00Z`,
        }),
      ),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.latestRequests().map((item) => item.id)).toEqual([4, 3, 2]);

    fixture.nativeElement.querySelector('.view-all').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.request-row').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.view-all').textContent).toContain('Ver menos');
  });

  it.each([
    { roles: ['ROLE_EMPLOYEE'], selector: 'app-employee-home' },
    { roles: ['ROLE_STAFF', 'ROLE_EMPLOYEE'], selector: 'app-staff-home' },
    { roles: ['ROLE_ADMIN', 'ROLE_STAFF'], selector: 'app-admin-home' },
  ])('selects $selector for the current roles', (example) => {
    roles.set(example.roles as Role[]);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    if (example.selector === 'app-employee-home') {
      listRequest().flush(page([]));
      fixture.detectChanges();
    }
    expect(fixture.nativeElement.querySelector(example.selector)).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('app-employee-home, app-staff-home, app-admin-home')
        .length,
    ).toBe(1);
  });

  it('loads all vacation pages and connects pending, upcoming and recent requests', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading-circle')).not.toBeNull();
    listRequest().flush(
      page([vacation(1, { startDate: '2026-11-20' }), vacation(2, { status: 'APPROVED' })], 0, 5),
    );
    const secondPage = listRequest();
    expect(secondPage.request.params.get('page')).toBe('1');
    expect(secondPage.request.params.get('size')).toBe('2');
    secondPage.flush(
      page(
        [
          vacation(3, { startDate: '2026-11-02' }),
          vacation(4, { status: 'REJECTED', startDate: '2026-11-01' }),
        ],
        1,
        5,
      ),
    );
    const thirdPage = listRequest();
    expect(thirdPage.request.params.get('page')).toBe('2');
    thirdPage.flush(page([vacation(5, { status: 'CANCELLED', startDate: '2026-11-01' })], 2, 5));
    fixture.detectChanges();
    const home = fixture.debugElement.query(By.directive(EmployeeHome))
      .componentInstance as EmployeeHome;
    expect(home.requests()).toHaveLength(5);
    expect(home.requests()[0].submittedAt).toBe('2026-10-21');
    expect(home.pendingCount()).toBe(2);
    expect(home.nextRequest()?.id).toBe(3);
    expect(home.latestRequests().map((request) => request.id)).toEqual([5, 4, 3]);
    expect(fixture.nativeElement.textContent).toContain('2 solicitudes');
    expect(fixture.nativeElement.textContent).toContain('Cancelada');
    expect(fixture.nativeElement.querySelector('app-loading-circle')).toBeNull();
  });

  it('fetches fresh vacation requests when returning to home', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    listRequest().flush(page([vacation(1)]));
    fixture.destroy();
    const returned = TestBed.createComponent(Home);
    returned.detectChanges();
    listRequest().flush(page([vacation(2), vacation(3)]));
    returned.detectChanges();
    const home = returned.debugElement.query(By.directive(EmployeeHome))
      .componentInstance as EmployeeHome;
    expect(home.requests().map((request) => request.id)).toEqual([2, 3]);
    expect(home.pendingCount()).toBe(2);
  });

  it('stops loading and shows a toast if vacation requests fail', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    listRequest().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-toast')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tus solicitudes.');
  });

  it('puts the newest request first when requests share a submission date', () => {
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.componentRef.setInput('requests', [
      request({ id: 1 }),
      request({ id: 3 }),
      request({ id: 2 }),
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.latestRequests().map((item) => item.id)).toEqual([3, 2, 1]);
  });

  const items: HiveCarouselItem[] = [
    { id: 'vacations', label: 'Mis vacaciones', description: '', icon: '' },
    { id: 'leaves', label: 'Mis licencias', description: '', icon: '' },
    { id: 'profile', label: 'Mi perfil', description: '', icon: '' },
  ];

  it('opens Mis vacaciones from the active home carousel card', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EmployeeHome);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.hive-card.is-active').click();
    expect(navigate).toHaveBeenCalledWith(['/my-vacations']);
    expect(fixture.componentInstance.notice()).toBeNull();
    navigate.mockRestore();
  });

  it('wraps through the carousel and changes the centered card', () => {
    const fixture = TestBed.createComponent(HiveCarousel);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[title="Anterior"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hive-card.is-active').textContent).toContain(
      'Mi perfil',
    );

    fixture.nativeElement.querySelector('[title="Siguiente"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hive-card.is-active').textContent).toContain(
      'Mis vacaciones',
    );
  });

  it('centers a side card before opening it', () => {
    const fixture = TestBed.createComponent(HiveCarousel);
    fixture.componentRef.setInput('items', items);
    const selected = vi.fn();
    fixture.componentInstance.itemSelected.subscribe(selected);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.hive-card.is-next').click();
    fixture.detectChanges();
    expect(selected).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('.hive-card.is-active').click();
    expect(selected).toHaveBeenCalledWith(items[1]);
  });

  it('supports arrow keys inside the carousel', () => {
    const fixture = TestBed.createComponent(HiveCarousel);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    fixture.nativeElement.querySelector('.hive-stage').dispatchEvent(event);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedIndex()).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
