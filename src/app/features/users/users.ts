import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})

export class Users implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  showModal = false;
  isEditMode = false;
  isViewMode = false;
  selectedUserId: string | null = null;
  form!: FormGroup;

  constructor(private supabase: SupabaseService, private loader: LoaderService, private fb: FormBuilder) { }

  ngOnInit() {
    this.initForm();
    this.loadRoles();
    this.loadUsers();
  }

  initForm() {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role_id: [null, Validators.required],
      is_active: [true]
    });
  }

  async loadRoles() {
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('role')
        .select('*')
        .eq('status', true)
        .order('role_name');

      if (error) throw error;
      this.roles = data || [];
    } catch (err) {
      console.error('LOAD ROLES ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async loadUsers() {
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          is_active,
          role_id,
          role:role_id(role_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.users = data || [];
    } catch (err) {
      console.error('LOAD USERS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedUserId = null;
    this.form.reset({
      full_name: '',
      email: '',
      role_id: null,
      is_active: true
    });
    this.form.enable();
    this.showModal = true;
  }

  openEditModal(user: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedUserId = user.id;
    this.form.patchValue({
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active
    });
    this.form.enable();
    this.showModal = true;
  }

  openViewModal(user: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedUserId = user.id;
    this.form.patchValue({
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active
    });
    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveUser() {
    if (this.form.invalid) return;
    this.loader.show();
    try {
      const value = this.form.getRawValue();
      if (this.isEditMode && this.selectedUserId) {
        const { error } = await this.supabase.client
          .from('profiles')
          .update({
            full_name: value.full_name,
            role_id: value.role_id,
            is_active: value.is_active
          })
          .eq('id', this.selectedUserId);

        if (error) throw error;
      } else {
        const { error } = await this.supabase.client
          .from('profiles')
          .insert({
            full_name: value.full_name,
            email: value.email,
            role_id: value.role_id,
            is_active: value.is_active
          });
        if (error) {
          console.warn('Insert warning (maybe trigger handles profile creation):', error);
        }
      }
      await this.loadUsers();
      this.closeModal();
    } catch (err) {
      console.error('SAVE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    this.loader.show();
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.loadUsers();
    } catch (err) {
      console.error('DELETE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async toggleStatus(user: any) {
    this.loader.show();
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      await this.loadUsers();
    } catch (err) {
      console.error('STATUS ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }
}