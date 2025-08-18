import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportPagosRecepcionComponent } from './report-pagos-recepcion.component';

describe('ReportPagosRecepcionComponent', () => {
  let component: ReportPagosRecepcionComponent;
  let fixture: ComponentFixture<ReportPagosRecepcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportPagosRecepcionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportPagosRecepcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
