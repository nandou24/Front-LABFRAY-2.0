import { TestBed } from '@angular/core/testing';

import { TipoMuestraService } from './tipo-muestra.service';

describe('TipoMuestraService', () => {
  let service: TipoMuestraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoMuestraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
