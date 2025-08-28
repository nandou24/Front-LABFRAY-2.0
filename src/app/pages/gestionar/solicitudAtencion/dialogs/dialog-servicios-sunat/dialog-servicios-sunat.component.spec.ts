import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogServiciosSunatComponent } from './dialog-servicios-sunat.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('DialogServiciosSunatComponent', () => {
  let component: DialogServiciosSunatComponent;
  let fixture: ComponentFixture<DialogServiciosSunatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogServiciosSunatComponent ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { serviciosTexto: '' } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogServiciosSunatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
