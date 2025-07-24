import { TestBed } from '@angular/core/testing';

import { HojaTrabajoLabPdfService } from './hoja-trabajo-lab-pdf.service';

describe('HojaTrabajoLabPdfService', () => {
  let service: HojaTrabajoLabPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HojaTrabajoLabPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
