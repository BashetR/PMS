import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { DataTable } from '../../shared/components/data-table/data-table';
import { FormModal } from '../../shared/components/form-modal/form-modal';
import { RoleCrudService } from '../../core/services/crud/role-crud.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTable, FormModal],
  templateUrl: './roles.html',
})
export class Roles implements OnInit {

  roles: any[] = [];

  activeTab: 'active' | 'inactive' = 'active';

  form!: FormGroup;

  mode: 'create' | 'edit' | 'view' = 'create';
  selectedId: number | null = null;

  page = 1;
  pageSize = 5;

  modalVisible = false;

  userMenuId!: number;

  // ✅ DataTable columns
  columns = [
    { key: 'role_name', label: 'Role' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created', type: 'date' },
    {
      type: 'actions',
      actions: [
        {
          name: 'permissions',
          icon: 'fas fa-key',
          class: 'btn-primary',
          show: () => this.can('assign')
        },
        {
          name: 'view',
          icon: 'fas fa-eye',
          class: 'btn-info',
          show: () => this.can('view')
        },
        {
          name: 'edit',
          icon: 'fas fa-edit',
          class: 'btn-warning',
          show: () => this.can('edit')
        },
        {
          name: 'delete',
          icon: 'fas fa-trash',
          class: 'btn-danger',
          show: () => this.can('delete')
        }
      ]
    }
  ];

  constructor(
    private crud: RoleCrudService,
    private permission: PermissionService,
    private fb: FormBuilder
  ) {
    this.initForm();
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
    return this.mode !== 'view' && this.can(this.mode === 'edit' ? 'edit' : 'create');
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
  // LOAD
  // =========================
  async load() {
    this.roles = await this.crud.getAll({
      select: 'id,role_name,description,status,created_at',
      page: 1,
      pageSize: 10
    });
    this.page = 1;
  }

  // =========================
  // FILTER
  // =========================
  get filtered() {
    return this.roles.filter(r =>
      this.activeTab === 'active' ? r.status : !r.status
    );
  }

  // =========================
  // PAGINATION
  // =========================
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

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  goToPage(p: number) {
    this.page = p;
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
    if (action === 'permissions') this.openPermissions(row);
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

    this.form.reset({ role_name: '', description: '', status: true });
    this.form.enable();

    this.modalVisible = true;
  }

  openEdit(role: any) {
    this.mode = 'edit';
    this.selectedId = role.id;

    this.form.patchValue(role);
    this.form.enable();

    this.modalVisible = true;
  }

  openView(role: any) {
    this.mode = 'view';
    this.selectedId = role.id;

    this.form.patchValue(role);
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
  async delete(id: number) {
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

  openPermissions(role: any) {
    if (!role?.id) return;
    window.location.href = `/admin/role-permissions/${role.id}`;
  }
}