import { TestBed } from '@angular/core/testing';

import { PruebaLabService } from './prueba-lab.service';

describe('PruebaLabService', () => {
  let service: PruebaLabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PruebaLabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
