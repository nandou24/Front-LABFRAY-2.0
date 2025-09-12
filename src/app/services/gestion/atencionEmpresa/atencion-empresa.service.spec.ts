import { TestBed } from '@angular/core/testing';

import { AtencionEmpresaService } from './atencion-empresa.service';

describe('AtencionEmpresaService', () => {
  let service: AtencionEmpresaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtencionEmpresaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
