import { TestBed } from '@angular/core/testing';

import { LaboratorioReferenciaService } from './laboratorio-referencia.service';

describe('LaboratorioReferenciaService', () => {
  let service: LaboratorioReferenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LaboratorioReferenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
