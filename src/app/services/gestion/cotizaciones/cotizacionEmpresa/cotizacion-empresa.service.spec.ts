import { TestBed } from '@angular/core/testing';

import { CotizacionEmpresaService } from './cotizacion-empresa.service';

describe('CotizacionEmpresaService', () => {
  let service: CotizacionEmpresaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CotizacionEmpresaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
