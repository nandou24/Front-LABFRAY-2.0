import { TestBed } from '@angular/core/testing';

import { SolicitudAtencionService } from './solicitud-atencion.service';

describe('SolicitudAtencionService', () => {
  let service: SolicitudAtencionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolicitudAtencionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
