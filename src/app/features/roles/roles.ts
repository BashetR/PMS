import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import Swal from 'sweetalert2';

import { RoleService } from '../../core/services/role.service';
import { LoaderService } from '../../core/services/loader.service';
import { PermissionService } from '../../core/services/permission.service';
import { CacheService } from '../../core/services/cache.service';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit, AfterViewInit {

  roles: any[] = [];
  activeTab: 'active' | 'inactive' = 'active';

  form!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  selectedRoleId: string | null = null;

  private modalInstance: any;

  userMenuId = 7;

  constructor(
    private roleService: RoleService,
    private cache: CacheService,
    private permission: PermissionService,
    private loader: LoaderService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadRoles();
  }

  ngAfterViewInit() {
    const modalEl = document.getElementById('roleModal');
    if (modalEl) {
      this.modalInstance = new bootstrap.Modal(modalEl);
    }
  }

  // =========================
  // PERMISSION
  // =========================
  can(action: string) {
    return this.permission.has(this.userMenuId, action);
  }

  // =========================
  // FORM
  // =========================
  initForm() {
    this.form = this.fb.group({
      role_name: ['', Validators.required],
      description: [''],
      status: [true]
    });
  }

  // =========================
  // LOAD ROLES (CACHE FIRST)
  // =========================
  async loadRoles() {

    this.loader.show();

    try {

      const cached = this.cache.get<any[]>('roles');

      if (cached && cached.length) {
        this.roles = cached;
      } else {
        this.roles = await this.roleService.getAll();
        this.cache.set('roles', this.roles);
      }

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to load roles', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // FILTER
  // =========================
  get filteredRoles() {
    return this.roles.filter(r =>
      this.activeTab === 'active' ? r.status : !r.status
    );
  }

  changeTab(tab: 'active' | 'inactive') {
    this.activeTab = tab;
  }

  // =========================
  // CREATE
  // =========================
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedRoleId = null;

    this.form.reset({
      role_name: '',
      description: '',
      status: true
    });

    this.form.enable();
    this.modalInstance.show();
  }

  // =========================
  // EDIT
  // =========================
  openEdit(role: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedRoleId = role.id;

    this.form.patchValue(role);
    this.form.enable();

    this.modalInstance.show();
  }

  // =========================
  // VIEW
  // =========================
  openViewModal(role: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedRoleId = role.id;

    this.form.patchValue(role);
    this.form.disable();

    this.modalInstance.show();
  }

  // =========================
  // SAVE (CACHE SYNC)
  // =========================
  async save() {

    if (this.form.invalid) return;

    this.loader.show();

    try {

      const value = this.form.value;

      if (this.isEditMode && this.selectedRoleId) {

        await this.roleService.update(this.selectedRoleId, value);

      } else {

        await this.roleService.create(value);
      }

      // 🔥 refresh cache
      const roles = await this.roleService.getAll();
      this.roles = roles;
      this.cache.set('roles', roles);

      Swal.fire('Success', 'Saved successfully', 'success');

      this.modalInstance.hide();

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Save failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // DELETE (CACHE UPDATE)
  // =========================
  async deleteRole(id: string) {

    const confirm = await Swal.fire({
      title: 'Delete role?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes delete'
    });

    if (!confirm.isConfirmed) return;

    this.loader.show();

    try {

      await this.roleService.delete(id);

      const roles = this.roles.filter(r => r.id !== id);

      this.roles = roles;
      this.cache.set('roles', roles);

      Swal.fire('Deleted', 'Role removed', 'success');

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Delete failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  openPermissions(role: any) {
    if (!role?.id) return;
    this.router.navigate(['/admin/role-permissions', role.id]);
  }
}