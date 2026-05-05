import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserCrudService } from '../../core/services/crud/user-crud.service';
import { PermissionService } from '../../core/services/permission.service';
import { DataTable } from '../../shared/components/data-table/data-table';
import { FormModal } from '../../shared/components/form-modal/form-modal';
import { RoleCrudService } from '../../core/services/crud/role-crud.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTable, FormModal],
  templateUrl: './users.html',
})

export class Users implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  form!: FormGroup;
  mode: 'create' | 'edit' | 'view' = 'create';
  selectedId: string | null = null;
  activeTab: 'active' | 'inactive' = 'active';
  page = 1;
  pageSize = 5;
  modalVisible = false;
  userMenuId!: number;
  columns: any[] = [];

  constructor(private crud: UserCrudService, private roleCrud: RoleCrudService, private permission: PermissionService, private fb: FormBuilder) {
    this.initForm();
    this.initTable();
  }

  ngOnInit() {
    this.userMenuId = this.permission.getCurrentMenuId();
    this.load();
  }

  // =========================
  // PERMISSION
  // =========================
  can(action: string) {
    return this.permission.has(this.userMenuId, action);
  }

  canSave() {
    return this.mode !== 'view' &&
      this.can(this.mode === 'edit' ? 'edit' : 'create');
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
  // TABLE CONFIG
  // =========================
  initTable() {
    this.columns = [
      { key: 'full_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role_name', label: 'Role' },
      { key: 'is_active', label: 'Status', type: 'status' },
      { key: 'created_at', label: 'Created', type: 'date' },
      {
        type: 'actions',
        actions: [
          { name: 'view', icon: 'fas fa-eye', class: 'btn-info', show: () => this.can('view') },
          { name: 'edit', icon: 'fas fa-edit', class: 'btn-warning', show: () => this.can('edit') },
          { name: 'delete', icon: 'fas fa-trash', class: 'btn-danger', show: () => this.can('delete') }
        ]
      }
    ];
  }

  // =========================
  // LOAD
  // =========================
  async load() {
    this.users = await this.crud.getAll({
      select: 'id,full_name,email,role:role_id(role_name),is_active,created_at',
      page: 1,
      pageSize: 10
    });
    this.roles = await this.roleCrud.getAll();
  }

  // =========================
  // FILTER + PAGINATION
  // =========================
  get filtered() {
    return this.users.filter(u =>
      this.activeTab === 'active' ? u.is_active : !u.is_active
    );
  }

  get paginated() {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  get totalPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  changeTab(tab: 'active' | 'inactive') {
    this.activeTab = tab;
    this.page = 1;
  }

  // =========================
  // ACTION HANDLER
  // =========================
  handleAction(e: any) {
    const { action, row } = e;

    if (action === 'view') this.openView(row);
    if (action === 'edit') this.openEdit(row);
    if (action === 'delete') this.delete(row.id);
  }

  // =========================
  // MODAL
  // =========================
  openCreate() {
    this.mode = 'create';
    this.selectedId = null;

    this.form.reset({
      full_name: '',
      email: '',
      role_id: null,
      is_active: true
    });

    this.form.enable();
    this.modalVisible = true;
  }

  openEdit(user: any) {
    this.mode = 'edit';
    this.selectedId = user.id;

    this.form.patchValue(user);
    this.form.enable();

    this.modalVisible = true;
  }

  openView(user: any) {
    this.mode = 'view';
    this.selectedId = user.id;

    this.form.patchValue(user);
    this.form.disable();

    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  // =========================
  // SAVE
  // =========================
  async save() {

    if (this.form.invalid) return;

    const value = this.form.getRawValue();

    if (this.mode === 'edit' && this.selectedId) {
      await this.crud.update(this.selectedId, value);
    } else {
      await this.crud.create(value);
    }

    await this.load();
    this.closeModal();
  }

  // =========================
  // DELETE
  // =========================
  async delete(id: string) {
    const confirm = await Swal.fire({
      title: 'Delete role?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes delete'
    });

    if (!confirm.isConfirmed) return;
    await this.crud.delete(id);
    await this.load();
  }
}