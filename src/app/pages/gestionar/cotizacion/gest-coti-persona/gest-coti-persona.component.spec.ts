import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestCotiPersonaComponent } from './gest-coti-persona.component';

describe('GestCotiPersonaComponent', () => {
  let component: GestCotiPersonaComponent;
  let fixture: ComponentFixture<GestCotiPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestCotiPersonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestCotiPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
