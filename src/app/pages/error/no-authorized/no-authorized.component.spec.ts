import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoAuthorizedComponent } from './no-authorized.component';

describe('NoAuthorizedComponent', () => {
  let component: NoAuthorizedComponent;
  let fixture: ComponentFixture<NoAuthorizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAuthorizedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoAuthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
