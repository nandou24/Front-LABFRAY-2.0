import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogBuscarEmpresaComponent } from './dialog-buscar-empresa.component';

describe('DialogBuscarEmpresaComponent', () => {
  let component: DialogBuscarEmpresaComponent;
  let fixture: ComponentFixture<DialogBuscarEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogBuscarEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogBuscarEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
