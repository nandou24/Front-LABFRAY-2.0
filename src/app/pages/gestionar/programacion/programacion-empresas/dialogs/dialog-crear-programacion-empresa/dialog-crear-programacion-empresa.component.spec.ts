import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCrearProgramacionEmpresaComponent } from './dialog-crear-programacion-empresa.component';

describe('DialogCrearProgramacionEmpresaComponent', () => {
  let component: DialogCrearProgramacionEmpresaComponent;
  let fixture: ComponentFixture<DialogCrearProgramacionEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCrearProgramacionEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCrearProgramacionEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block edit for attended or cancelled programations', () => {
    expect(component.puedeEditarProgramacion('ATENDIDO')).toBeFalse();
    expect(component.puedeEditarProgramacion('CANCELADO')).toBeFalse();
    expect(component.puedeEditarProgramacion('PROGRAMADO')).toBeTrue();
    expect(component.puedeEditarProgramacion('EN ATENCION')).toBeTrue();
  });
});
