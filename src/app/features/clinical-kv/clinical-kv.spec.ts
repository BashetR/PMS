import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalKv } from './clinical-kv';

describe('ClinicalKv', () => {
  let component: ClinicalKv;
  let fixture: ComponentFixture<ClinicalKv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalKv],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalKv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
