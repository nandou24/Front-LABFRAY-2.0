import { TestBed } from '@angular/core/testing';

import { TuboEnvaseService } from './tubo-envase.service';

describe('TuboEnvaseService', () => {
  let service: TuboEnvaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TuboEnvaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
