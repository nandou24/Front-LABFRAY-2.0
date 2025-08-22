import { TestBed } from '@angular/core/testing';

import { CotiEmpresaPdfService } from './coti-empresa-pdf.service';

describe('CotiEmpresaPdfService', () => {
  let service: CotiEmpresaPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CotiEmpresaPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
