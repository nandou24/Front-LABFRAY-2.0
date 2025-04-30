import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantPruebaLabComponent } from './mant-prueba-lab.component';

describe('MantPruebaLabComponent', () => {
  let component: MantPruebaLabComponent;
  let fixture: ComponentFixture<MantPruebaLabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantPruebaLabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantPruebaLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
