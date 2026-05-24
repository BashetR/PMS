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
import { ManufacturerService } from '../../../core/services/medicine_setup/manufacturer.service';
import { PermissionService } from '../../../core/services/permission.service';


declare var bootstrap: any;

@Component({
  selector: 'app-manufacturer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './manufacturer.html',
  styleUrl: './manufacturer.css'
})
export class Manufacturer implements OnInit, AfterViewInit {

  manufacturers: any[] = [];

  activeTab = 'active';

  page = 1;
  pageSize = 10;

  form!: FormGroup;

  isEditMode = false;
  isViewMode = false;

  selectedId: number | null = null;

  private modalInstance: any;

  // Change menu id according to your Menu table
  userMenuId = 14;

  constructor(
    private manufacturerService: ManufacturerService,
    private permission: PermissionService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadManufacturers();
  }

  ngAfterViewInit(): void {

    const modalEl =
      document.getElementById('manufacturerModal');

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
    return this.permission.has(
      this.userMenuId,
      action
    );
  }

  initForm() {

    this.form = this.fb.group({
      manufacturer_name: [
        '',
        Validators.required
      ],
      contact_no: [''],
      email: ['', Validators.email],
      address: [''],
      country: [''],
      website: [''],
      is_active: [true]
    });
  }

  async loadManufacturers() {

    this.loader.show();

    try {

      this.manufacturers =
        await this.manufacturerService.getManufacturers();

      this.page = 1;

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message,
        'error'
      );

    } finally {
      this.loader.hide();
    }
  }

  get filteredManufacturers() {

    return this.manufacturers.filter(x =>
      this.activeTab === 'active'
        ? x.is_active
        : !x.is_active
    );
  }

  get totalPages() {
    return Math.ceil(
      this.filteredManufacturers.length /
      this.pageSize
    );
  }

  get totalPagesArray() {

    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  get paginatedManufacturers() {

    const start =
      (this.page - 1) * this.pageSize;

    return this.filteredManufacturers.slice(
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

    this.form.reset({
      is_active: true
    });

    this.form.enable();

    this.modalInstance.show();
  }

  openEditModal(row: any) {

    this.isEditMode = true;
    this.isViewMode = false;

    this.selectedId = row.id;

    this.form.patchValue(row);

    this.form.enable();

    this.modalInstance.show();
  }

  openViewModal(row: any) {

    this.isViewMode = true;
    this.isEditMode = false;

    this.selectedId = row.id;

    this.form.patchValue(row);

    this.form.disable();

    this.modalInstance.show();
  }

  closeModal() {
    this.modalInstance.hide();
  }

  async save() {

    if (this.form.invalid)
      return;

    this.loader.show();

    try {

      const payload =
        this.form.getRawValue();

      if (
        this.isEditMode &&
        this.selectedId
      ) {

        await this.manufacturerService
          .updateManufacturer(
            this.selectedId,
            payload
          );

        Swal.fire(
          'Updated',
          'Manufacturer updated successfully',
          'success'
        );

      } else {

        await this.manufacturerService
          .createManufacturer(payload);

        Swal.fire(
          'Created',
          'Manufacturer created successfully',
          'success'
        );
      }

      await this.loadManufacturers();

      this.closeModal();

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message,
        'error'
      );

    } finally {

      this.loader.hide();
    }
  }

  confirmDelete(row: any) {

    Swal.fire({
      title: 'Delete?',
      text:
        row.manufacturer_name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33'
    }).then(result => {

      if (result.isConfirmed) {
        this.deleteManufacturer(row.id);
      }
    });
  }

  async deleteManufacturer(id: number) {

    this.loader.show();

    try {

      await this.manufacturerService
        .deleteManufacturer(id);

      Swal.fire(
        'Deleted',
        'Manufacturer removed',
        'success'
      );

      await this.loadManufacturers();

    } catch (err: any) {

      Swal.fire(
        'Error',
        err.message,
        'error'
      );

    } finally {

      this.loader.hide();
    }
  }
}