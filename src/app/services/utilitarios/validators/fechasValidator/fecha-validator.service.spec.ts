import { TestBed } from '@angular/core/testing';

import { FechaValidatorService } from './fecha-validator.service';

describe('FechaValidatorService', () => {
  let service: FechaValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FechaValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
