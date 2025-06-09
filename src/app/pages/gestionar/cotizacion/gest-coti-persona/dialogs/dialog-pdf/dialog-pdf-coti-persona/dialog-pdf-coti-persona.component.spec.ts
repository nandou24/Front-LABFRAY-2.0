import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPdfCotiPersonaComponent } from './dialog-pdf-coti-persona.component';

describe('DialogPdfCotiPersonaComponent', () => {
  let component: DialogPdfCotiPersonaComponent;
  let fixture: ComponentFixture<DialogPdfCotiPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPdfCotiPersonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPdfCotiPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
