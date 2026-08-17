import { TestBed } from '@angular/core/testing';

import { ProgramacionEmpresaService } from './programacion-empresa.service';

describe('ProgramacionEmpresaService', () => {
  let service: ProgramacionEmpresaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgramacionEmpresaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
