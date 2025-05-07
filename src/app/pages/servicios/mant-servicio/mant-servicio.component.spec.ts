import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantServicioComponent } from './mant-servicio.component';

describe('MantServicioComponent', () => {
  let component: MantServicioComponent;
  let fixture: ComponentFixture<MantServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantServicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
