import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPoliclinicoComponent } from './login-policlinico.component';

describe('LoginPoliclinicoComponent', () => {
  let component: LoginPoliclinicoComponent;
  let fixture: ComponentFixture<LoginPoliclinicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPoliclinicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPoliclinicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
