import { TestBed } from '@angular/core/testing';

import { CotizacionPersonalService } from './cotizacion-personal.service';

describe('CotizacionPersonalService', () => {
  let service: CotizacionPersonalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CotizacionPersonalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
