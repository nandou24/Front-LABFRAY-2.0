import { TestBed } from '@angular/core/testing';

import { DocValidatorService } from './doc-validator.service';

describe('DocValidatorService', () => {
  let service: DocValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
