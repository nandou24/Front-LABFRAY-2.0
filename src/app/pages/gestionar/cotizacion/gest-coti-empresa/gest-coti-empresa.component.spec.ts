import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestCotiEmpresaComponent } from './gest-coti-empresa.component';

describe('GestCotiEmpresaComponent', () => {
  let component: GestCotiEmpresaComponent;
  let fixture: ComponentFixture<GestCotiEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestCotiEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestCotiEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
