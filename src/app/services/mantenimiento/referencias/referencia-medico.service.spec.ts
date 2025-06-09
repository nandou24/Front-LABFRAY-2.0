import { TestBed } from '@angular/core/testing';

import { ReferenciaMedicoService } from './referencia-medico.service';

describe('ReferenciaMedicoService', () => {
  let service: ReferenciaMedicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenciaMedicoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
