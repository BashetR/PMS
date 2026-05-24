import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import Swal from 'sweetalert2';
import { LoaderService } from '../../../core/services/loader.service';
import { DosageFormService } from '../../../core/services/medicine_setup/dosage-form.service';
import { PermissionService } from '../../../core/services/permission.service';

declare var bootstrap: any;

@Component({
  selector: 'app-dosage-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dosage-form.html',
  styleUrl: './dosage-form.css'
})
export class DosageForm implements OnInit, AfterViewInit {

  dosageForms: any[] = [];

  activeTab = 'active';

  form!: FormGroup;

  isEditMode = false;
  isViewMode = false;

  selectedId: number | null = null;

  page = 1;
  pageSize = 10;

  private modalInstance: any;

  // Dosage Form Menu Id
  userMenuId = 13;

  constructor(
    private dosageFormService: DosageFormService,
    private permission: PermissionService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadDosageForms();
  }

  ngAfterViewInit() {

    const modalEl =
      document.getElementById('dosageFormModal');

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

  initForm() {

    this.form = this.fb.group({
      dosage_form_name: [
        '',
        Validators.required
      ],
      prefix: [''],
      is_active: [true]
    });
  }

  async loadDosageForms() {

    this.loader.show();

    try {

      this.dosageForms =
        await this.dosageFormService.getAll();

      this.page = 1;

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message ||
        'Failed to load dosage forms',
        'error'
      );

    } finally {
      this.loader.hide();
    }
  }

  get filteredDosageForms() {

    return this.dosageForms.filter(x =>
      this.activeTab === 'active'
        ? x.is_active
        : !x.is_active
    );
  }

  get totalPages() {

    return Math.ceil(
      this.filteredDosageForms.length /
      this.pageSize
    );
  }

  get totalPagesArray() {

    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  get paginatedDosageForms() {

    const start =
      (this.page - 1) * this.pageSize;

    return this.filteredDosageForms.slice(
      start,
      start + this.pageSize
    );
  }

  goToPage(page: number) {
    this.page = page;
  }

  nextPage() {

    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  prevPage() {

    if (this.page > 1) {
      this.page--;
    }
  }

  changeTab(tab: string) {

    this.activeTab = tab;
    this.page = 1;
  }

  openCreateModal() {

    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;

    this.form.reset({
      dosage_form_name: '',
      prefix: '',
      is_active: true
    });

    this.form.enable();

    this.modalInstance.show();
  }

  openEditModal(item: any) {

    this.isEditMode = true;
    this.isViewMode = false;

    this.selectedId = item.id;

    this.form.patchValue(item);

    this.form.enable();

    this.modalInstance.show();
  }

  openViewModal(item: any) {

    this.isViewMode = true;
    this.isEditMode = false;

    this.selectedId = item.id;

    this.form.patchValue(item);

    this.form.disable();

    this.modalInstance.show();
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  async save() {

    if (this.form.invalid) {

      this.form.markAllAsTouched();
      return;
    }

    this.loader.show();

    try {

      const payload =
        this.form.getRawValue();

      if (
        this.isEditMode &&
        this.selectedId
      ) {

        await this.dosageFormService.update(
          this.selectedId,
          payload
        );

        Swal.fire(
          'Updated!',
          'Dosage Form updated successfully',
          'success'
        );

      } else {

        await this.dosageFormService.create(
          payload
        );

        Swal.fire(
          'Created!',
          'Dosage Form created successfully',
          'success'
        );
      }

      await this.loadDosageForms();

      this.closeModal();

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message || 'Save failed',
        'error'
      );

    } finally {
      this.loader.hide();
    }
  }

  confirmDelete(item: any) {

    Swal.fire({
      title: 'Are you sure?',
      text:
        `Delete "${item.dosage_form_name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    }).then(result => {

      if (result.isConfirmed) {
        this.delete(item.id);
      }
    });
  }

  async delete(id: number) {

    this.loader.show();

    try {

      await this.dosageFormService.delete(id);

      Swal.fire(
        'Deleted!',
        'Dosage Form deleted successfully',
        'success'
      );

      await this.loadDosageForms();

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message || 'Delete failed',
        'error'
      );

    } finally {
      this.loader.hide();
    }
  }
}