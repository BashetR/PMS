import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LoaderService } from '../../../core/services/loader.service';
import { GenericService } from '../../../core/services/medicine_setup/generic.service';
import { PermissionService } from '../../../core/services/permission.service';
declare var bootstrap: any;

@Component({
  selector: 'app-generic-setup',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './generic-setup.html',
  styleUrl: './generic-setup.css',
})

export class GenericSetup implements OnInit, AfterViewInit {
  generics: any[] = [];

  activeTab = 'active';

  form!: FormGroup;

  isEditMode = false;
  isViewMode = false;

  selectedId: number | null = null;

  page = 1;
  pageSize = 10;

  private modalInstance: any;

  // Change according to menu table
  userMenuId = 12;

  constructor( private genericService: GenericService, private permission: PermissionService, private loader: LoaderService, private fb: FormBuilder ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadGenerics();
  }

  ngAfterViewInit() {

    const modalEl = document.getElementById('genericModal');

    if (modalEl) {

      this.modalInstance = new bootstrap.Modal(
        modalEl,
        {
          backdrop: 'static',
          keyboard: false
        }
      );
    }
  }

  can(action: string) {
    return this.permission.has(this.userMenuId, action);
  }

  initForm() {

    this.form = this.fb.group({
      generic_name: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  async loadGenerics() {

    this.loader.show();

    try {

      this.generics = await this.genericService.getAll();

      this.page = 1;

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message || 'Failed to load generics',
        'error'
      );

    } finally {
      this.loader.hide();
    }
  }

  get filteredGenerics() {

    return this.generics.filter(x =>
      this.activeTab === 'active'
        ? x.is_active
        : !x.is_active
    );
  }

  get totalPages() {

    return Math.ceil(
      this.filteredGenerics.length / this.pageSize
    );
  }

  get totalPagesArray() {

    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  get paginatedGenerics() {

    const start = (this.page - 1) * this.pageSize;

    return this.filteredGenerics.slice(
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
      generic_name: '',
      description: '',
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

      const payload = this.form.getRawValue();

      if (this.isEditMode && this.selectedId) {

        await this.genericService.update(
          this.selectedId,
          payload
        );

        Swal.fire(
          'Updated!',
          'Generic updated successfully',
          'success'
        );

      } else {

        await this.genericService.create(payload);

        Swal.fire(
          'Created!',
          'Generic created successfully',
          'success'
        );
      }

      await this.loadGenerics();

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
      text: `Delete "${item.generic_name}" ?`,
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

      await this.genericService.delete(id);

      Swal.fire(
        'Deleted!',
        'Generic deleted successfully',
        'success'
      );

      await this.loadGenerics();

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