import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  activeTab = 'active';
  page = 1;
  pageSize = 5;
  showModal = false;
  isEditMode = false;
  isViewMode = false;
  selectedId: number | null = null;
  form!: FormGroup;
  userMenuId = 4;

  constructor(private menuService: MenuService, private permissionService: PermissionService, private loader: LoaderService, private fb: FormBuilder) {
    this.initForm();
  }

  async ngOnInit() {
    await this.loadMenus();
  }

  can(action: string) {
    return this.permissionService.has(this.userMenuId, action);
  }

  initForm() {
    this.form = this.fb.group({
      menu_name: ['', Validators.required],
      slug: ['', Validators.required],
      icon: [''],
      route: [''],
      parent_id: [null],
      order_no: [0, Validators.required],
      menu_type: ['menu', Validators.required],
      status: [true]
    });
  }

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

  get filteredMenus() {
    return this.menus.filter(m =>
      this.activeTab === 'active'
        ? m.status
        : !m.status
    );
  }

  get paginatedMenus() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredMenus.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.page * this.pageSize < this.filteredMenus.length) {
      this.page++;
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  get mainMenus() {
    return this.menus.filter(m =>
      m.menu_type === 'menu'
    );
  }

  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;
    this.form.reset({
      menu_name: '',
      slug: '',
      icon: '',
      route: '',
      parent_id: null,
      order_no: 0,
      menu_type: 'menu',
      status: true
    });
    this.form.enable();
    this.showModal = true;
  }

  openEditModal(m: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedId = m.id;
    this.form.patchValue({ ...m });
    this.form.enable();
    this.showModal = true;
  }

  openViewModal(m: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.form.patchValue({ ...m });
    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    if (value.menu_type === 'sub-menu' && !value.parent_id) {
      Swal.fire(
        'Error',
        'Sub-menu requires parent menu',
        'error'
      );
      return;
    }
    this.loader.show();
    try {
      if (this.isEditMode && this.selectedId) {
        await this.menuService.update(
          this.selectedId,
          value
        );
        Swal.fire(
          'Success',
          'Menu updated',
          'success'
        );
      } else {
        await this.menuService.create(value);
        Swal.fire(
          'Success',
          'Menu created',
          'success'
        );
      }
      await this.loadMenus();
      this.closeModal();
    } catch (err) {
      console.error('SAVE ERROR:', err);
      Swal.fire(
        'Error',
        'Something went wrong',
        'error'
      );
    } finally {
      this.loader.hide();
    }
  }

  async deleteMenu(id: number) {
    const confirm = await Swal.fire({
      title: 'Delete menu?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true
    });
    if (!confirm.isConfirmed) return;
    this.loader.show();
    try {
      await this.menuService.delete(id);
      Swal.fire(
        'Deleted',
        'Menu removed',
        'success'
      );
      await this.loadMenus();
    } catch (err) {
      console.error('DELETE ERROR:', err);
      Swal.fire(
        'Error',
        'Delete failed',
        'error'
      );
    } finally {
      this.loader.hide();
    }
  }
}