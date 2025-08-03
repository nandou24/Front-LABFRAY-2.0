import { TestBed } from '@angular/core/testing';

import { NumberValidatorService } from './number-validator.service';

describe('NumberValidatorService', () => {
  let service: NumberValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumberValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
