import { TestBed } from '@angular/core/testing';

import { PagosCotizacionPersonalService } from './pagos-cotizacion-personal.service';

describe('PagosCotizacionPersonalService', () => {
  let service: PagosCotizacionPersonalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagosCotizacionPersonalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
