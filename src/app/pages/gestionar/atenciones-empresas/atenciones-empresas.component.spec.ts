import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtencionesEmpresasComponent } from './atenciones-empresas.component';

describe('AtencionesEmpresasComponent', () => {
  let component: AtencionesEmpresasComponent;
  let fixture: ComponentFixture<AtencionesEmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtencionesEmpresasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtencionesEmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
