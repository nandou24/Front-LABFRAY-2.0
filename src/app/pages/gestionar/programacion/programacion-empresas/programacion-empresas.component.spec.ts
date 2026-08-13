import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramacionEmpresasComponent } from './programacion-empresas.component';

describe('ProgramacionEmpresasComponent', () => {
  let component: ProgramacionEmpresasComponent;
  let fixture: ComponentFixture<ProgramacionEmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramacionEmpresasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramacionEmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
