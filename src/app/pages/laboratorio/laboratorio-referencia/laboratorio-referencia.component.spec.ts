import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratorioReferenciaComponent } from './laboratorio-referencia.component';

describe('LaboratorioReferenciaComponent', () => {
  let component: LaboratorioReferenciaComponent;
  let fixture: ComponentFixture<LaboratorioReferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaboratorioReferenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaboratorioReferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
