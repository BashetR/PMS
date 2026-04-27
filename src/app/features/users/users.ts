import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { LoaderService } from '../../core/services/loader.service';
import { PermissionService } from '../../core/services/permission.service';
import { CacheService } from '../../core/services/cache.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {

  users: any[] = [];
  roles: any[] = [];

  showModal = false;
  isEditMode = false;
  isViewMode = false;
  selectedUserId: string | null = null;

  form!: FormGroup;
  userMenuId = 6;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private permission: PermissionService,
    private cache: CacheService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
  }

  can(action: string) {
    return this.permission.has(this.userMenuId, action);
  }

  // =========================
  // FORM
  // =========================
  initForm() {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role_id: [null, Validators.required],
      is_active: [true]
    });
  }

  // =========================
  // LOAD INITIAL (CACHE FIRST)
  // =========================
  async loadInitialData() {

    this.loader.show();

    try {

      // -------------------------
      // USERS (CACHE FIRST)
      // -------------------------
      const cachedUsers = this.cache.get<any[]>('users');

      if (cachedUsers) {
        this.users = cachedUsers;
      } else {
        this.users = await this.userService.getUsers();
        this.cache.set('users', this.users);
      }

      // -------------------------
      // ROLES (CACHE FIRST)
      // -------------------------
      const cachedRoles = this.cache.get<any[]>('roles');

      if (cachedRoles) {
        this.roles = cachedRoles;
      } else {
        this.roles = await this.roleService.getAll();
        this.cache.set('roles', this.roles);
      }

    } catch (err) {
      console.error('INIT LOAD ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // REFRESH USERS ONLY
  // =========================
  async loadUsers() {

    this.loader.show();

    try {
      this.users = await this.userService.getUsers();
      this.cache.set('users', this.users);

    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to load users', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // CREATE
  // =========================
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedUserId = null;

    this.form.reset({
      full_name: '',
      email: '',
      role_id: null,
      is_active: true
    });

    this.form.enable();
    this.showModal = true;
  }

  // =========================
  // EDIT
  // =========================
  openEditModal(user: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedUserId = user.id;

    this.form.patchValue(user);
    this.form.enable();
    this.showModal = true;
  }

  // =========================
  // VIEW
  // =========================
  openViewModal(user: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedUserId = user.id;

    this.form.patchValue(user);
    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // =========================
  // SAVE (CACHE UPDATE)
  // =========================
  async saveUser() {

    if (this.form.invalid) return;

    this.loader.show();

    try {

      const value = this.form.getRawValue();

      if (this.isEditMode && this.selectedUserId) {

        await this.userService.updateUser(this.selectedUserId, value);

      } else {

        await this.userService.createUser(value);
      }

      // 🔥 refresh + cache sync
      const users = await this.userService.getUsers();
      this.users = users;
      this.cache.set('users', users);

      this.closeModal();

    } catch (err) {
      console.error('SAVE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // DELETE (CACHE UPDATE)
  // =========================
  async deleteUser(id: string) {

    if (!confirm('Delete this user?')) return;

    this.loader.show();

    try {

      await this.userService.deleteUser(id);

      const users = this.users.filter(u => u.id !== id);

      this.users = users;
      this.cache.set('users', users);

    } catch (err) {
      console.error('DELETE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // TOGGLE STATUS
  // =========================
  async toggleStatus(user: any) {

    this.loader.show();

    try {

      await this.userService.toggleUserStatus(user.id, !user.is_active);

      const updated = this.users.map(u =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      );

      this.users = updated;
      this.cache.set('users', updated);

    } catch (err) {
      console.error('STATUS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }
}