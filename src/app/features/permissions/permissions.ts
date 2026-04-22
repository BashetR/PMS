import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LoaderService } from '../../core/services/loader.service';
declare var bootstrap: any;

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.html',
  styleUrl: './permissions.css',
})

export class Permissions implements OnInit, AfterViewInit {
  permissions: any[] = [];
  activeTab = 'active';
  form!: FormGroup;
  isEditMode = false;
  isViewMode = false;
  selectedPermissionId: string | null = null;
  page = 1;
  pageSize = 5;
  private modalInstance: any;

  constructor(private supabase: SupabaseService, private fb: FormBuilder, private loader: LoaderService) {
    this.initForm();
  }

  async ngOnInit() {
    await this.loadPermissions();
  }

  ngAfterViewInit() {
    const modalEl = document.getElementById('permissionModal');
    if (modalEl) {
      this.modalInstance = new bootstrap.Modal(modalEl, {
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  async loadPermissions() {
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.permissions = data || [];
      this.page = 1;
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      this.loader.hide();
    }
  }

  get filteredPermissions() {
    return this.permissions.filter(p =>
      this.activeTab === 'active' ? p.is_active : !p.is_active
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredPermissions.length / this.pageSize);
  }

  get totalPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  get paginatedPermissions() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPermissions.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    this.page = p;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.page = 1;
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedPermissionId = null;
    this.form.reset({
      name: '',
      description: '',
      is_active: true
    });
    this.form.enable();
    this.modalInstance.show();
  }

  openEditModal(p: any) {
    this.isEditMode = true;
    this.selectedPermissionId = p.id;
    this.form.patchValue(p);
    this.modalInstance.show();
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  async save() {
    if (this.form.invalid) return;
    this.loader.show();
    try {
      const value = this.form.getRawValue();
      if (this.isEditMode && this.selectedPermissionId) {
        const { error } = await this.supabase.client
          .from('permissions')
          .update(value)
          .eq('id', this.selectedPermissionId);

        if (error) throw error;
        Swal.fire('Updated!', 'Permission updated', 'success');
      } else {
        const { error } = await this.supabase.client
          .from('permissions')
          .insert([value]);

        if (error) throw error;
        Swal.fire('Created!', 'Permission created', 'success');
      }
      await this.loadPermissions();
      this.closeModal();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      this.loader.hide();
    }
  }

  confirmDelete(permission: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete "${permission.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePermission(permission.id);
      }
    });
  }

  async deletePermission(id: string) {
    this.loader.show();
    try {
      const { error } = await this.supabase.client
        .from('permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      Swal.fire('Deleted!', 'Permission deleted successfully', 'success');
      await this.loadPermissions();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      this.loader.hide();
    }
  }
}