import { TestBed } from '@angular/core/testing';

import { CotiPersonaPdfServiceService } from './coti-persona-pdf.service.service';

describe('CotiPersonaPdfServiceService', () => {
  let service: CotiPersonaPdfServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CotiPersonaPdfServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
