import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCrearAtencionComponent } from './dialog-crear-atencion.component';

describe('DialogCrearAtencionComponent', () => {
  let component: DialogCrearAtencionComponent;
  let fixture: ComponentFixture<DialogCrearAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCrearAtencionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCrearAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
