import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericSetup } from './generic-setup';

describe('GenericSetup', () => {
  let component: GenericSetup;
  let fixture: ComponentFixture<GenericSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericSetup],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
