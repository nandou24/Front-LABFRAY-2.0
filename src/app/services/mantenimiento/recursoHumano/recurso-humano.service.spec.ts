import { TestBed } from '@angular/core/testing';

import { RecursoHumanoService } from './recurso-humano.service';

describe('RecursoHumanoService', () => {
  let service: RecursoHumanoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecursoHumanoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
