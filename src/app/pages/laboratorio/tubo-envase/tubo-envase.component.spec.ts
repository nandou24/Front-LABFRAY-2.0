import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TuboEnvaseComponent } from './tubo-envase.component';

describe('TuboEnvaseComponent', () => {
  let component: TuboEnvaseComponent;
  let fixture: ComponentFixture<TuboEnvaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuboEnvaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TuboEnvaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
