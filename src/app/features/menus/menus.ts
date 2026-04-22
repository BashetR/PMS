import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { LoaderService } from '../../core/services/loader.service';

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

  constructor(private supabase: SupabaseService, private fb: FormBuilder, private loader: LoaderService) {
    this.initForm();
  }

  async ngOnInit() {
    await this.loadMenus();
    await this.loadPermissions();
    this.permissionSearchControl.valueChanges.subscribe(value => {
      this.filterPermissions(value || '');
    });
  }

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

  async loadMenus() {
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('menu')
        .select('*')
        .order('order_no', { ascending: true });

      if (error) throw error;
      this.menus = data || [];
    } catch (err) {
      console.error('LOAD MENUS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async loadPermissions() {
    try {
      const { data, error } = await this.supabase.client
        .from('permissions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      this.permissionList = data || [];
      this.filteredPermissionList = this.permissionList;
    } catch (err) {
      console.error('LOAD PERMISSIONS ERROR:', err);
    }
  }

  filterPermissions(search: string) {
    const term = search.toLowerCase();
    this.filteredPermissionList = this.permissionList.filter(p =>
      p.name.toLowerCase().includes(term)
    );
  }

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

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.loader.show();
    try {
      const value = this.form.getRawValue();
      if (value.menu_type === 'sub-menu' && !value.parent_id) {
        Swal.fire('Error', 'Sub-menu must have parent menu', 'error');
        return;
      }

      if (value.menu_type === 'menu') {
        value.parent_id = null;
      }

      value.permission_list = (value.permission_list || []).map((id: number) => ({
        permission_id: id
      }));

      if (this.isEditMode && this.selectedId) {
        const { error } = await this.supabase.client
          .from('menu')
          .update(value)
          .eq('id', this.selectedId);

        if (error) throw error;
        Swal.fire('Success', 'Menu updated', 'success');
      } else {
        const { error } = await this.supabase.client
          .from('menu')
          .insert(value);

        if (error) throw error;
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
      const { error } = await this.supabase.client
        .from('menu')
        .delete()
        .eq('id', id);

      if (error) throw error;
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