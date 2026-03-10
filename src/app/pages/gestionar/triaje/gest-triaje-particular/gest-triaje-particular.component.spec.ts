import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestTriajeParticularComponent } from './gest-triaje-particular.component';

describe('GestTriajeParticularComponent', () => {
  let component: GestTriajeParticularComponent;
  let fixture: ComponentFixture<GestTriajeParticularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestTriajeParticularComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestTriajeParticularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
