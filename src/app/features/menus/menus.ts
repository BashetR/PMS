import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl
} from '@angular/forms';

import Swal from 'sweetalert2';

import { LoaderService } from '../../core/services/loader.service';
import { PermissionService } from '../../core/services/permission.service';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menus.html',
  styleUrl: './menus.css'
})
export class Menus implements OnInit {

  menus: any[] = [];
  permissionList: any[] = [];
  filteredPermissionList: any[] = [];

  activeTab = 'active';
  page = 1;
  pageSize = 5;

  showModal = false;
  isEditMode = false;
  isViewMode = false;
  selectedId: number | null = null;

  permissionDropdownOpen = false;
  permissionSearchControl = new FormControl('');

  form!: FormGroup;

  userMenuId = 4; // menu id for RBAC

  constructor(
    private menuService: MenuService,            // ✅ USE SERVICE
    private permissionService: PermissionService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  async ngOnInit() {
    await this.loadMenus();
    await this.loadPermissions();

    this.permissionSearchControl.valueChanges.subscribe(value => {
      this.filterPermissions(value || '');
    });
  }

  // =========================
  // PERMISSION CHECK
  // =========================
  can(action: string) {
    return this.permissionService.has(this.userMenuId, action);
  }

  // =========================
  // FORM
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
  // LOAD MENUS
  // =========================
  async loadMenus() {
    this.loader.show();
    try {
      this.menus = await this.menuService.getAll();
    } catch (err) {
      console.error('LOAD MENUS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // LOAD PERMISSIONS
  // =========================
  async loadPermissions() {
    this.loader.show();
    try {
      this.permissionList = await this.permissionService.getPermissions();
      this.filteredPermissionList = this.permissionList;
    } catch (err) {
      console.error('LOAD PERMISSIONS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  filterPermissions(search: string) {
    this.filteredPermissionList =
      this.permissionService.filterPermissions(this.permissionList, search);
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

  nextPage() { this.page++; }
  prevPage() { if (this.page > 1) this.page--; }

  get mainMenus() {
    return this.menus.filter(m => m.menu_type === 'menu');
  }

  // =========================
  // MODAL
  // =========================
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;

    this.permissionDropdownOpen = false;
    this.permissionSearchControl.setValue('');

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
    this.showModal = true;
  }

  openEditModal(m: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedId = m.id;

    const permissions = (m.permission_list || []).map((p: any) => p.permission_id);

    this.form.patchValue({
      ...m,
      permission_list: permissions
    });

    this.form.enable();
    this.showModal = true;
  }

  openViewModal(m: any) {
    this.isViewMode = true;
    this.isEditMode = false;

    const permissions = (m.permission_list || []).map((p: any) => p.permission_id);

    this.form.patchValue({
      ...m,
      permission_list: permissions
    });

    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.permissionDropdownOpen = false;
  }

  // =========================
  // SAVE
  // =========================
  async save(): Promise<void> {
    if (this.form.invalid) return;

    this.loader.show();

    try {
      const value = this.form.getRawValue();

      if (value.menu_type === 'sub-menu' && !value.parent_id) {
        Swal.fire('Error', 'Sub-menu must have parent menu', 'error');
        return;
      }

      if (this.isEditMode && this.selectedId) {
        await this.menuService.update(this.selectedId, value);
        Swal.fire('Success', 'Menu updated', 'success');
      } else {
        await this.menuService.create(value);
        Swal.fire('Success', 'Menu created', 'success');
      }

      await this.loadMenus();
      this.closeModal();

    } catch (err) {
      console.error('SAVE ERROR:', err);
      Swal.fire('Error', 'Something went wrong', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // DELETE
  // =========================
  async deleteMenu(id: number): Promise<void> {

    const confirm = await Swal.fire({
      title: 'Delete menu?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    this.loader.show();

    try {
      await this.menuService.delete(id);

      Swal.fire('Deleted', 'Menu removed', 'success');

      await this.loadMenus();
      this.closeModal();

    } catch (err) {
      console.error('DELETE ERROR:', err);
      Swal.fire('Error', 'Delete failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // PERMISSION UI HANDLING
  // =========================
  togglePermissionDropdown() {
    this.permissionDropdownOpen = !this.permissionDropdownOpen;
  }

  togglePermission(id: number, event: any) {
    const list = this.form.value.permission_list || [];

    if (event.target.checked) {
      if (!list.includes(id)) list.push(id);
    } else {
      const index = list.indexOf(id);
      if (index > -1) list.splice(index, 1);
    }

    this.form.patchValue({
      permission_list: [...list]
    });
  }

  removePermission(id: number) {
    const updated = (this.form.value.permission_list || [])
      .filter((x: number) => x !== id);

    this.form.patchValue({
      permission_list: updated
    });
  }

  isAllSelected(): boolean {
    return this.filteredPermissionList.length > 0 &&
      this.filteredPermissionList.every(p =>
        this.form.value.permission_list.includes(p.id)
      );
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      const allIds = this.filteredPermissionList.map(p => p.id);

      const merged = Array.from(new Set([
        ...(this.form.value.permission_list || []),
        ...allIds
      ]));

      this.form.patchValue({ permission_list: merged });

    } else {
      const remaining = (this.form.value.permission_list || [])
        .filter((id: number) =>
          !this.filteredPermissionList.some(p => p.id === id)
        );

      this.form.patchValue({ permission_list: remaining });
    }
  }
}