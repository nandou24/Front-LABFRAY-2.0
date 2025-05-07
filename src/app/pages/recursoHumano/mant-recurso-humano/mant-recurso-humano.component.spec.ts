import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantRecursoHumanoComponent } from './mant-recurso-humano.component';

describe('MantRecursoHumanoComponent', () => {
  let component: MantRecursoHumanoComponent;
  let fixture: ComponentFixture<MantRecursoHumanoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantRecursoHumanoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MantRecursoHumanoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
