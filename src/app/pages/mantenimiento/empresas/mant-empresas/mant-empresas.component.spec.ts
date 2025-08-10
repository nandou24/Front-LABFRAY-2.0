import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantEmpresasComponent } from './mant-empresas.component';

describe('MantEmpresasComponent', () => {
  let component: MantEmpresasComponent;
  let fixture: ComponentFixture<MantEmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantEmpresasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantEmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
