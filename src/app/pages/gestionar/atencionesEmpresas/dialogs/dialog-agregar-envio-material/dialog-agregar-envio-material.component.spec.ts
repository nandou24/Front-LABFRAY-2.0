import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAgregarEnvioMaterialComponent } from './dialog-agregar-envio-material.component';

describe('DialogAgregarEnvioMaterialComponent', () => {
  let component: DialogAgregarEnvioMaterialComponent;
  let fixture: ComponentFixture<DialogAgregarEnvioMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAgregarEnvioMaterialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAgregarEnvioMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
