import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestPagoCotiPersonaComponent } from './gest-pago-coti-persona.component';

describe('GestPagoCotiPersonaComponent', () => {
  let component: GestPagoCotiPersonaComponent;
  let fixture: ComponentFixture<GestPagoCotiPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestPagoCotiPersonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestPagoCotiPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
