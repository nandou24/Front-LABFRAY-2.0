import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenciaMedicoComponent } from './referencia-medico.component';

describe('ReferenciaMedicoComponent', () => {
  let component: ReferenciaMedicoComponent;
  let fixture: ComponentFixture<ReferenciaMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenciaMedicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferenciaMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
