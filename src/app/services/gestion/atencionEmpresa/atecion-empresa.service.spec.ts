import { TestBed } from '@angular/core/testing';

import { AtecionEmpresaService } from './atecion-empresa.service';

describe('AtecionEmpresaService', () => {
  let service: AtecionEmpresaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtecionEmpresaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
