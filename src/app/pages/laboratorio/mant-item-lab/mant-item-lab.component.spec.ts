import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantItemLabComponent } from './mant-item-lab.component';

describe('MantItemLabComponent', () => {
  let component: MantItemLabComponent;
  let fixture: ComponentFixture<MantItemLabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantItemLabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantItemLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
