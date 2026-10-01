import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGestionarTomaComponent } from './dialog-gestionar-toma.component';

describe('DialogGestionarTomaComponent', () => {
  let component: DialogGestionarTomaComponent;
  let fixture: ComponentFixture<DialogGestionarTomaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogGestionarTomaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogGestionarTomaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
