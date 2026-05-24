import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DosageForm } from './dosage-form';

describe('DosageForm', () => {
  let component: DosageForm;
  let fixture: ComponentFixture<DosageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DosageForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DosageForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
