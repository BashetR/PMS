import { Component, OnInit } from '@angular/core';
import { BaseCrudComponent } from '../../shared/base/base-crud.component';
import { FormBuilder } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { PermissionService } from '../../core/services/permission.service';
import { CrudTable } from '../../shared/components/crud-table/crud-table';
import { CrudModal } from '../../shared/components/crud-modal/crud-modal';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, CrudTable, CrudModal],
  templateUrl: './menus.html'
})
export class Menus extends BaseCrudComponent implements OnInit {

  permissionList: any[] = [];
  mainMenus: any[] = [];
  menus: any[] = [];

  permissionDropdownOpen = false;
  filteredPermissionList: any[] = [];

  constructor(
    fb: FormBuilder,
    loader: LoaderService,
    private menuService: MenuService,
    private permissionService: PermissionService
  ) {
    super(fb, loader);

    this.form = this.fb.group({
      id: [null],
      menu_name: [''],
      slug: [''],
      icon: [''],
      route: [''],
      menu_type: ['menu'],
      parent_id: [null],
      order_no: [0],
      status: [true],
      permission_list: [[]]
    });
  }

  // ================= CONFIG (REUSABLE) =================
  config = {
    title: 'Menus',

    api: {
      getAll: () => this.menuService.getAll(),
      create: (data: any) => this.menuService.create(data),
      update: (id: any, data: any) => this.menuService.update(id, data),
      delete: (id: any) => this.menuService.delete(id)
    },

    columns: [
      { field: 'menu_name', label: 'Name' },
      { field: 'menu_type', label: 'Type' },
      { field: 'icon', label: 'Icon' },
      { field: 'route', label: 'Route' },
      { field: 'status', label: 'Status', type: 'badge' }
    ],

    formFields: [
      { name: 'menu_name', label: 'Name', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'icon', label: 'Icon', type: 'text' },
      { name: 'route', label: 'Route', type: 'text' },
      {
        name: 'menu_type',
        label: 'Type',
        type: 'select',
        options: [
          { id: 'menu', name: 'Menu' },
          { id: 'sub-menu', name: 'Sub Menu' }
        ]
      },
      { name: 'parent_id', label: 'Parent Menu', type: 'select', options: [] },
      { name: 'order_no', label: 'Order', type: 'number' },
      { name: 'status', label: 'Active', type: 'checkbox' }
    ]
  };

  // ================= INIT =================
  async ngOnInit() {
    await this.loadData();
    await this.loadMenus();
    await this.loadPermissions();
  }

  // ================= LOAD PERMISSIONS =================
  async loadPermissions() {
    this.permissionList = await this.permissionService.getPermissions();
    this.filteredPermissionList = [...this.permissionList];
  }

  async loadMenus() {
    const data = await this.menuService.getAll();

    this.menus = data;
    this.mainMenus = this.menus.filter(m => m.menu_type === 'menu');

    const parentField = this.config.formFields.find(f => f.name === 'parent_id');

    if (parentField) {
      parentField.options = this.mainMenus.map(m => ({
        id: m.id,
        name: m.menu_name
      }));
    }
  }

  // ================= OPEN MODAL =================
  override openCreate() {
    super.openCreate();
    this.form.patchValue({ permission_list: [] });
  }

  override openEdit(row: any) {
    super.openEdit(row);
    this.form.patchValue({
      permission_list: row.permission_list || []
    });
  }

  // ================= PERMISSION LOGIC =================
  togglePermission(id: string, event: any) {
    let list = this.form.value.permission_list || [];

    if (event.target.checked) {
      list = [...list, id];
    } else {
      list = list.filter((x: any) => x !== id);
    }

    this.form.patchValue({ permission_list: list });
  }

  removePermission(id: string) {
    const list = (this.form.value.permission_list || []).filter((x: any) => x !== id);
    this.form.patchValue({ permission_list: list });
  }

  togglePermissionDropdown() {
    this.permissionDropdownOpen = !this.permissionDropdownOpen;
  }

  isAllSelected(): boolean {
    const list = this.form.value.permission_list || [];
    return list.length === this.permissionList.length;
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.form.patchValue({
      permission_list: checked ? this.permissionList.map(p => p.id) : []
    });
  }
}