import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoMuestraComponent } from './tipo-muestra.component';

describe('TipoMuestraComponent', () => {
  let component: TipoMuestraComponent;
  let fixture: ComponentFixture<TipoMuestraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoMuestraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoMuestraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
