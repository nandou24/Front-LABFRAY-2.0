import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPdfCotiEmpresaComponent } from './dialog-pdf-coti-empresa.component';

describe('DialogPdfCotiEmpresaComponent', () => {
  let component: DialogPdfCotiEmpresaComponent;
  let fixture: ComponentFixture<DialogPdfCotiEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPdfCotiEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPdfCotiEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
