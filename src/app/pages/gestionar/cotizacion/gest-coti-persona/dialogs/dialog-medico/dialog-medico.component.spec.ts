import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMedicoComponent } from './dialog-medico.component';

describe('DialogMedicoComponent', () => {
  let component: DialogMedicoComponent;
  let fixture: ComponentFixture<DialogMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogMedicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
