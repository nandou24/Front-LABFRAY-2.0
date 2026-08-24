import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogIniciarAtencionEmpresaComponent } from './dialog-iniciar-atencion-empresa.component';

describe('DialogIniciarAtencionEmpresaComponent', () => {
  let component: DialogIniciarAtencionEmpresaComponent;
  let fixture: ComponentFixture<DialogIniciarAtencionEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogIniciarAtencionEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogIniciarAtencionEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
