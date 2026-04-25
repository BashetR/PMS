import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudTable } from './crud-table';

describe('CrudTable', () => {
  let component: CrudTable;
  let fixture: ComponentFixture<CrudTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudTable],
    }).compileComponents();

    fixture = TestBed.createComponent(CrudTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
