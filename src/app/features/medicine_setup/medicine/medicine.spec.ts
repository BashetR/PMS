import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Medicine } from './medicine';

describe('Medicine', () => {
  let component: Medicine;
  let fixture: ComponentFixture<Medicine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Medicine],
    }).compileComponents();

    fixture = TestBed.createComponent(Medicine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
