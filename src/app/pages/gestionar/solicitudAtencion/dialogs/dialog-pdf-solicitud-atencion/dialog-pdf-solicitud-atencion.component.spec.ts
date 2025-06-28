import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPdfSolicitudAtencionComponent } from './dialog-pdf-solicitud-atencion.component';

describe('DialogPdfSolicitudAtencionComponent', () => {
  let component: DialogPdfSolicitudAtencionComponent;
  let fixture: ComponentFixture<DialogPdfSolicitudAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPdfSolicitudAtencionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPdfSolicitudAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
