import {
  Component,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';

import { MenuCrudService } from '../../core/services/crud/menu-crud.service';
import { PermissionService } from '../../core/services/permission.service';

import { DataTable } from '../../shared/components/data-table/data-table';
import { FormModal } from '../../shared/components/form-modal/form-modal';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTable, FormModal],
  templateUrl: './menus.html',
})
export class Menus implements OnInit {

  menus: any[] = [];
  permissions: any[] = [];

  form!: FormGroup;

  mode: 'create' | 'edit' | 'view' = 'create';
  selectedId: number | null = null;

  activeTab: 'active' | 'inactive' = 'active';

  page = 1;
  pageSize = 5;

  userMenuId!: number;

  columns: any[] = [];

  permissionSearch = new FormControl('');
  filteredPermissions: any[] = [];

  // ✅ MODAL CONTROL (FIXED)
  isModalOpen = false;

  constructor(
    private crud: MenuCrudService,
    private permissionService: PermissionService,
    private fb: FormBuilder
  ) {
    this.initForm();
    this.initTable();
  }

  // =========================
  // INIT
  // =========================
  ngOnInit() {
    this.userMenuId = this.permissionService.getCurrentMenuId();
    this.load();

    this.permissionSearch.valueChanges.subscribe(v => {
      this.filteredPermissions =
        this.permissionService.filterPermissions(this.permissions, v || '');
    });
  }

  // =========================
  // PERMISSION
  // =========================
  can(action: string) {
    return this.permissionService.has(this.userMenuId, action);
  }

  canSave() {
    return this.mode !== 'view' &&
      this.can(this.mode === 'edit' ? 'edit' : 'create');
  }

  // =========================
  // FORM INIT
  // =========================
  initForm() {
    this.form = this.fb.group({
      menu_name: ['', Validators.required],
      slug: ['', Validators.required],
      icon: [''],
      route: [''],
      parent_id: [null],
      order_no: [0],
      menu_type: ['menu', Validators.required],
      status: [true],
      permission_list: [[]]
    });
  }

  // =========================
  // TABLE CONFIG
  // =========================
  initTable() {
    this.columns = [
      { key: 'menu_name', label: 'Name' },
      { key: 'menu_type', label: 'Type' },
      { key: 'route', label: 'Route' },
      { key: 'order_no', label: 'Order' },
      { key: 'status', label: 'Status', type: 'status' },
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
  // LOAD DATA
  // =========================
  async load() {
    const [menus, permissions] = await Promise.all([
      this.crud.getAll({
        select: 'id,menu_name,menu_type,route,order_no,status,created_at',
        page: 1,
        pageSize: 10
      }),
      this.permissionService.getPermissions()
    ]);

    this.menus = menus;
    this.permissions = permissions;
    this.filteredPermissions = this.permissions;
  }

  // =========================
  // FILTER + PAGINATION
  // =========================
  get filteredMenus() {
    return this.menus.filter(m =>
      this.activeTab === 'active' ? m.status : !m.status
    );
  }

  get paginatedMenus() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredMenus.slice(start, start + this.pageSize);
  }

  changeTab(tab: 'active' | 'inactive') {
    this.activeTab = tab;
    this.page = 1;
  }

  nextPage() {
    if (this.page * this.pageSize < this.filteredMenus.length) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  // =========================
  // HELPERS
  // =========================
  get mainMenus() {
    return this.menus.filter(m => m.menu_type === 'menu');
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
      menu_name: '',
      slug: '',
      icon: '',
      route: '',
      parent_id: null,
      order_no: 0,
      menu_type: 'menu',
      status: true,
      permission_list: []
    });

    this.form.enable();
    this.isModalOpen = true;
  }

  openEdit(m: any) {
    this.mode = 'edit';
    this.selectedId = m.id;

    this.form.patchValue({
      ...m,
      permission_list: m.permission_list?.map((p: any) => p.permission_id) || []
    });

    this.form.enable();
    this.isModalOpen = true;
  }

  openView(m: any) {
    this.mode = 'view';
    this.selectedId = m.id;

    this.form.patchValue({
      ...m,
      permission_list: m.permission_list?.map((p: any) => p.permission_id) || []
    });

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

    if (value.menu_type === 'sub-menu' && !value.parent_id) {
      alert('Sub-menu must have parent');
      return;
    }

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

  // =========================
  // PERMISSION SELECT
  // =========================
  togglePermission(id: number) {
    const list = this.form.value.permission_list || [];

    const updated = list.includes(id)
      ? list.filter((x: number) => x !== id)
      : [...list, id];

    this.form.patchValue({ permission_list: updated });
  }
}