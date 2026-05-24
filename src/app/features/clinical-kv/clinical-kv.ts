import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import Swal from 'sweetalert2';

import { LoaderService } from '../../core/services/loader.service';
import { PermissionService } from '../../core/services/permission.service';
import { ClinicalKvService } from '../../core/services/clinical-kv.service';

declare var bootstrap: any;

@Component({
  selector: 'app-clinical-kv',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './clinical-kv.html',
  styleUrl: './clinical-kv.css',
})

export class ClinicalKv implements OnInit, AfterViewInit {
  clinicalValues: any[] = [];
  clinicalKeys: any[] = [];

  activeTab = 'active';

  page = 1;
  pageSize = 10;

  form!: FormGroup;

  isEditMode = false;
  isViewMode = false;

  selectedId: number | null = null;

  modalInstance: any;

  // CHANGE MENU ID
  userMenuId = 16;

  constructor(
    private fb: FormBuilder,
    private service: ClinicalKvService,
    private permission: PermissionService,
    private loader: LoaderService
  ) {

    this.form = this.fb.group({
      rows: this.fb.array([])
    });

  }

  ngOnInit() {

    this.loadData();
    this.loadKeys();

  }

  ngAfterViewInit() {

    const modalEl =
      document.getElementById('clinicalModal');

    if (modalEl) {

      this.modalInstance =
        new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: false
        });

    }
  }

  can(action: string) {
    return this.permission.has(
      this.userMenuId,
      action
    );
  }

  get rows() {
    return this.form.get('rows') as FormArray;
  }

  createRow(data?: any) {

    return this.fb.group({
      clinical_key_id: [
        data?.clinical_key_id ?? null,
        Validators.required
      ],

      clinical_value: [
        data?.clinical_value ?? '',
        Validators.required
      ]
    });

  }

  addRow() {
    this.rows.push(this.createRow());
  }

  removeRow(index: number) {

    if (this.rows.length === 1) return;

    this.rows.removeAt(index);

  }

  async loadKeys() {

    this.clinicalKeys =
      await this.service.getClinicalKeys();

  }

  async loadData() {

    this.loader.show();

    try {

      this.clinicalValues =
        await this.service.getAll();

    } finally {

      this.loader.hide();

    }
  }

  get filteredData() {

    return this.clinicalValues.filter(x =>
      this.activeTab === 'active'
        ? x.is_active
        : !x.is_active
    );

  }

  get totalPages() {

    return Math.ceil(
      this.filteredData.length /
      this.pageSize
    );

  }

  get totalPagesArray() {

    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);

  }

  get paginatedData() {

    const start =
      (this.page - 1) * this.pageSize;

    return this.filteredData.slice(
      start,
      start + this.pageSize
    );

  }

  changeTab(tab: string) {

    this.activeTab = tab;
    this.page = 1;

  }

  goToPage(page: number) {
    this.page = page;
  }

  nextPage() {
    if (this.page < this.totalPages)
      this.page++;
  }

  prevPage() {
    if (this.page > 1)
      this.page--;
  }

  openCreateModal() {

    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;

    this.rows.clear();

    this.addRow();

    this.form.enable();

    this.modalInstance.show();

  }

  openEditModal(item: any) {

    this.isEditMode = true;
    this.isViewMode = false;

    this.selectedId =
      item.clinical_kv_id;

    this.rows.clear();

    this.rows.push(
      this.createRow(item)
    );

    this.form.enable();

    this.modalInstance.show();

  }

  openViewModal(item: any) {

    this.isEditMode = false;
    this.isViewMode = true;

    this.selectedId =
      item.clinical_kv_id;

    this.rows.clear();

    this.rows.push(
      this.createRow(item)
    );

    this.form.disable();

    this.modalInstance.show();

  }

  closeModal() {
    this.modalInstance.hide();
  }

  async save() {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.loader.show();

    try {

      if (this.isEditMode) {

        const row =
          this.rows.at(0).value;

        await this.service.update(
          this.selectedId!,
          row
        );

        Swal.fire(
          'Updated',
          'Record Updated',
          'success'
        );

      } else {

        for (const row of this.rows.value) {

          await this.service.create({
            clinical_key_id:
              row.clinical_key_id,

            clinical_value:
              row.clinical_value,

            is_active: true
          });

        }

        Swal.fire(
          'Created',
          'Record Created',
          'success'
        );
      }

      this.closeModal();

      await this.loadData();

    } catch (e: any) {

      Swal.fire(
        'Error',
        e.message,
        'error'
      );

    } finally {

      this.loader.hide();

    }
  }

  confirmDelete(row: any) {

    Swal.fire({
      title: 'Delete Record?',
      icon: 'warning',
      showCancelButton: true
    }).then(result => {

      if (result.isConfirmed) {

        this.delete(row.clinical_kv_id);

      }

    });

  }

  async delete(id: number) {

    await this.service.delete(id);

    await this.loadData();

    Swal.fire(
      'Deleted',
      '',
      'success'
    );

  }

}