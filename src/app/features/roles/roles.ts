import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AppCacheService } from '../../core/services/app-cache.service';
import { LoaderService } from '../../core/services/loader.service';
declare var bootstrap: any;

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})

export class Roles implements OnInit, AfterViewInit {
  roles: any[] = [];
  activeTab: 'active' | 'inactive' = 'active';
  form!: FormGroup;
  isEditMode = false;
  selectedRoleId: string | null = null;
  private modalInstance: any;

  constructor(private supabase: SupabaseService, private fb: FormBuilder, private cache: AppCacheService, private loader: LoaderService) {
    this.initForm();
  }

  ngOnInit() {
    this.loadRoles();
  }

  ngAfterViewInit() {
    const modalEl = document.getElementById('roleModal');
    if (modalEl) {
      this.modalInstance = new bootstrap.Modal(modalEl);
    }
  }

  initForm() {
    this.form = this.fb.group({
      role_name: ['', Validators.required],
      description: [''],
      status: [true]
    });
  }

  async loadRoles() {
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('role')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.roles = data || [];
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to load roles', 'error');
    } finally {
      this.loader.hide();
    }
  }

  get filteredRoles() {
    return this.roles.filter(r =>
      this.activeTab === 'active' ? r.status : !r.status
    );
  }

  changeTab(tab: 'active' | 'inactive') {
    this.activeTab = tab;
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedRoleId = null;
    this.form.reset({
      role_name: '',
      description: '',
      status: true
    });
    this.modalInstance.show();
  }

  openEdit(role: any) {
    this.isEditMode = true;
    this.selectedRoleId = role.id;
    this.form.patchValue({
      role_name: role.role_name,
      description: role.description,
      status: role.status
    });
    this.modalInstance.show();
  }

  async save() {
    if (this.form.invalid) return;
    this.loader.show();
    try {
      const value = this.form.value;
      const now = new Date().toISOString();
      if (this.isEditMode && this.selectedRoleId) {
        const { error } = await this.supabase.client
          .from('role')
          .update({
            ...value,
            updated_at: now
          })
          .eq('id', this.selectedRoleId);

        if (error) throw error;
        Swal.fire('Success', 'Role updated', 'success');
      } else {
        const { error } = await this.supabase.client
          .from('role')
          .insert([{
            ...value,
            created_at: now
          }]);

        if (error) throw error;
        Swal.fire('Success', 'Role created', 'success');
      }
      await this.loadRoles();
      this.modalInstance.hide();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Save failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  async deleteRole(id: string) {
    const confirm = await Swal.fire({
      title: 'Delete role?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes delete'
    });
    if (!confirm.isConfirmed) return;
    this.loader.show();
    try {
      const { error } = await this.supabase.client
        .from('role')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.loadRoles();
      Swal.fire('Deleted', 'Role removed', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Delete failed', 'error');
    } finally {
      this.loader.hide();
    }
  }

  openPermissions(role: any) {
    console.log('Permissions for:', role);
  }
}