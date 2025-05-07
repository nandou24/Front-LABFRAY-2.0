import { TestBed } from '@angular/core/testing';

import { ItemLabService } from './item-lab.service';

describe('ItemLabService', () => {
  let service: ItemLabService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemLabService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
