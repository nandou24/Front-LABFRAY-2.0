import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogRegistroPacienteComponent } from './dialog-registro-paciente.component';

describe('DialogRegistroPacienteComponent', () => {
  let component: DialogRegistroPacienteComponent;
  let fixture: ComponentFixture<DialogRegistroPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogRegistroPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogRegistroPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
