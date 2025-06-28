import { TestBed } from '@angular/core/testing';

import { HcPdfService } from './hc-pdf.service';

describe('HcPdfService', () => {
  let service: HcPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HcPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
