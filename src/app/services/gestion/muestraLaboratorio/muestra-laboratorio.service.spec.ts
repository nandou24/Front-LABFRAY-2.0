import { TestBed } from '@angular/core/testing';

import { MuestraLaboratorioService } from './muestra-laboratorio.service';

describe('MuestraLaboratorioService', () => {
  let service: MuestraLaboratorioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MuestraLaboratorioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
