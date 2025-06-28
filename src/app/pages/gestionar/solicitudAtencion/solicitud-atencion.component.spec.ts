import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudAtencionComponent } from './solicitud-atencion.component';

describe('SolicitudAtencionComponent', () => {
  let component: SolicitudAtencionComponent;
  let fixture: ComponentFixture<SolicitudAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudAtencionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
