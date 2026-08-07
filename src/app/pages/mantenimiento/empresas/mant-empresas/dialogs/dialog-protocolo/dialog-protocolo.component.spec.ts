import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProtocoloComponent } from './dialog-protocolo.component';

describe('DialogProtocoloComponent', () => {
  let component: DialogProtocoloComponent;
  let fixture: ComponentFixture<DialogProtocoloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogProtocoloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogProtocoloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
