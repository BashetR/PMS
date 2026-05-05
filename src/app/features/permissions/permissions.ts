import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { PermissionService } from '../../core/services/permission.service';
import { PermissionCrudService } from '../../core/services/crud/permission-crud.service';

import { DataTable } from "../../shared/components/data-table/data-table";
import { FormModal } from '../../shared/components/form-modal/form-modal';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTable, FormModal],
  templateUrl: './permissions.html',
})
export class Permissions implements OnInit {

  permissions: any[] = [];

  form!: FormGroup;

  mode: 'create' | 'edit' | 'view' = 'create';
  selectedId: string | null = null;

  activeTab: 'active' | 'inactive' = 'active';

  page = 1;
  pageSize = 5;

  userMenuId!: number;

  // ✅ MODAL CONTROL (FIXED)
  isModalOpen = false;

  columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
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

  constructor(
    private crud: PermissionCrudService,
    private permission: PermissionService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  // =========================
  // INIT
  // =========================
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
      name: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  // =========================
  // LOAD
  // =========================
  async load() {
    this.permissions = await this.crud.getAll({
      select: 'id,name,description,is_active,created_at',
      page: 1,
      pageSize: 10
    });

    this.page = 1;
  }

  // =========================
  // FILTER
  // =========================
  get filtered() {
    return this.permissions.filter(p =>
      this.activeTab === 'active' ? p.is_active : !p.is_active
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

    if (action === 'view') this.openView(row);
    if (action === 'edit') this.openEdit(row);
    if (action === 'delete') this.delete(row.id);
  }

  // =========================
  // MODAL CONTROL (FIXED)
  // =========================
  openCreate() {
    this.mode = 'create';
    this.selectedId = null;

    this.form.reset({
      name: '',
      description: '',
      is_active: true
    });

    this.form.enable();
    this.isModalOpen = true;
  }

  openEdit(p: any) {
    this.mode = 'edit';
    this.selectedId = p.id;

    this.form.patchValue(p);
    this.form.enable();
    this.isModalOpen = true;
  }

  openView(p: any) {
    this.mode = 'view';
    this.selectedId = p.id;

    this.form.patchValue(p);
    this.form.disable();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
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
    this.isModalOpen = false;
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