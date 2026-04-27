import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { LoaderService } from '../../core/services/loader.service';
import { PermissionService } from '../../core/services/permission.service';

declare var bootstrap: any;

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.html',
  styleUrl: './permissions.css',
})
export class Permissions implements OnInit, AfterViewInit {

  permissions: any[] = [];
  activeTab = 'active';

  form!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  selectedPermissionId: string | null = null;

  page = 1;
  pageSize = 5;

  private modalInstance: any;

  userMenuId = 8; // ✅ Permissions menu id

  constructor(
    private permissionService: PermissionService, // ✅ USE SERVICE
    private permission: PermissionService,        // for RBAC check
    private loader: LoaderService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadPermissions();
  }

  ngAfterViewInit() {
    const modalEl = document.getElementById('permissionModal');
    if (modalEl) {
      this.modalInstance = new bootstrap.Modal(modalEl, {
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  // =========================
  // PERMISSION CHECK
  // =========================
  can(action: string) {
    return this.permission.has(this.userMenuId, action);
  }

  // =========================
  // FORM
  // =========================
  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  // =========================
  // LOAD
  // =========================
  async loadPermissions() {
    this.loader.show();
    try {
      this.permissions = await this.permissionService.getPermissions();
      this.page = 1;
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to load', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // FILTER + PAGINATION
  // =========================
  get filteredPermissions() {
    return this.permissions.filter(p =>
      this.activeTab === 'active' ? p.is_active : !p.is_active
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredPermissions.length / this.pageSize);
  }

  get totalPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  get paginatedPermissions() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPermissions.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    this.page = p;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.page = 1;
  }

  // =========================
  // MODAL
  // =========================
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedPermissionId = null;

    this.form.reset({
      name: '',
      description: '',
      is_active: true
    });

    this.form.enable();
    this.modalInstance.show();
  }

  openEditModal(p: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedPermissionId = p.id;

    this.form.patchValue(p);
    this.form.enable();

    this.modalInstance.show();
  }

  openViewModal(p: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedPermissionId = p.id;

    this.form.patchValue(p);
    this.form.disable();

    this.modalInstance.show();
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  // =========================
  // SAVE
  // =========================
  async save() {
    if (this.form.invalid) return;

    this.loader.show();

    try {
      const value = this.form.getRawValue();

      if (this.isEditMode && this.selectedPermissionId) {

        await this.permissionService.updatePermission(
          this.selectedPermissionId,
          value
        );

        Swal.fire('Updated!', 'Permission updated', 'success');

      } else {

        await this.permissionService.createPermission(value);

        Swal.fire('Created!', 'Permission created', 'success');
      }

      await this.loadPermissions();
      this.closeModal();

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Save failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // DELETE
  // =========================
  confirmDelete(permission: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete "${permission.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePermission(permission.id);
      }
    });
  }

  async deletePermission(id: string) {
    this.loader.show();

    try {
      await this.permissionService.deletePermission(id);

      Swal.fire('Deleted!', 'Permission deleted successfully', 'success');

      await this.loadPermissions();

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Delete failed', 'error');
    } finally {
      this.loader.hide();
    }
  }
}