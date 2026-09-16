import { TestBed } from '@angular/core/testing';

import { ResultadosLaboratorioService } from './resultados-laboratorio.service';

describe('ResultadosLaboratorioService', () => {
  let service: ResultadosLaboratorioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResultadosLaboratorioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
