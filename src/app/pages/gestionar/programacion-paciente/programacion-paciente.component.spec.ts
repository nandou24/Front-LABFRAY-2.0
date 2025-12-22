import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramacionPacienteComponent } from './programacion-paciente.component';

describe('ProgramacionPacienteComponent', () => {
  let component: ProgramacionPacienteComponent;
  let fixture: ComponentFixture<ProgramacionPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramacionPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramacionPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
