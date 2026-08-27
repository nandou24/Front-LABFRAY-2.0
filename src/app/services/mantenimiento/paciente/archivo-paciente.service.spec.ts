import { TestBed } from '@angular/core/testing';

import { ArchivoPacienteService } from './archivo-paciente.service';

describe('ArchivoPacienteService', () => {
  let service: ArchivoPacienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchivoPacienteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
