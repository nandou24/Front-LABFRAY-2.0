import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantPacientesRecepcionComponent } from './mant-pacientes-recepcion.component';

describe('MantPacientesRecepcionComponent', () => {
  let component: MantPacientesRecepcionComponent;
  let fixture: ComponentFixture<MantPacientesRecepcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantPacientesRecepcionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantPacientesRecepcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
