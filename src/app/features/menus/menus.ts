import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menus.html',
  styleUrl: './menus.css'
})
export class Menus implements OnInit {

  menus: any[] = [];
  loading = false;

  activeTab = 'active';

  // Pagination
  page = 1;
  pageSize = 5;

  // Modal
  showModal = false;
  isEditMode = false;
  isViewMode = false;
  selectedId: string | null = null;

  form!: FormGroup;

  constructor(private supabase: SupabaseService, private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() {
    this.loadMenus();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      icon: [''],
      route: [''],
      parent_id: [null],
      display_order: [0],
      is_active: [true]
    });
  }

  // 🔥 LOAD DATA
  async loadMenus() {
    this.loading = true;

    const { data } = await this.supabase.client
      .from('menus')
      .select('*')
      .order('display_order', { ascending: true });

    this.menus = data || [];
    this.loading = false;
  }

  // 🔥 FILTER
  get filteredMenus() {
    return this.menus.filter(m =>
      this.activeTab === 'active' ? m.is_active : !m.is_active
    );
  }

  // 🔥 PAGINATION
  get paginatedMenus() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredMenus.slice(start, start + this.pageSize);
  }

  nextPage() {
    this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  // 🔥 MODAL OPEN
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;

    this.form.reset({
      name: '',
      icon: '',
      route: '',
      parent_id: null,
      display_order: 0,
      is_active: true
    });

    this.form.enable();
    this.showModal = true;
  }

  openEditModal(m: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedId = m.id;

    this.form.patchValue(m);
    this.form.enable();
    this.showModal = true;
  }

  openViewModal(m: any) {
    this.isViewMode = true;
    this.isEditMode = false;

    this.form.patchValue(m);
    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // 🔥 SAVE
  async save() {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();

    if (this.isEditMode && this.selectedId) {
      await this.supabase.client
        .from('menus')
        .update(value)
        .eq('id', this.selectedId);

      Swal.fire('Updated!', 'Menu updated successfully', 'success');

    } else {
      await this.supabase.client
        .from('menus')
        .insert(value);

      Swal.fire('Created!', 'Menu created successfully', 'success');
    }

    this.closeModal();
    this.loadMenus();
  }

  // 🔥 DELETE
  async deleteMenu(id: string) {
    const confirm = await Swal.fire({
      title: 'Delete menu?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    });

    if (!confirm.isConfirmed) return;

    await this.supabase.client
      .from('menus')
      .delete()
      .eq('id', id);

    Swal.fire('Deleted!', 'Menu removed', 'success');
    this.loadMenus();
  }
}