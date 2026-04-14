import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  showModal = false;
  isEditMode = false;
  isViewMode = false;

  selectedUserId: string | null = null;

  form!: FormGroup;

  constructor(
    private supabase: SupabaseService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadUsers();
  }

  // ================= FORM =================
  initForm() {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['user'],
      is_active: [true]
    });
  }

  // ================= LOAD USERS =================
  async loadUsers() {
    this.loader.show();

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);

    this.users = data || [];
    this.loader.hide();
  }

  // ================= CREATE =================
  openCreateModal() {
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedUserId = null;

    this.form.reset({
      role: 'user',
      is_active: true
    });

    this.form.enable();
    this.showModal = true;
  }

  // ================= EDIT =================
  openEditModal(user: any) {
    this.isEditMode = true;
    this.isViewMode = false;
    this.selectedUserId = user.id;

    this.form.patchValue(user);
    this.form.enable();
    this.showModal = true;
  }

  // ================= VIEW =================
  openViewModal(user: any) {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedUserId = user.id;

    this.form.patchValue(user);
    this.form.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // ================= SAVE (FIXED) =================
  async saveUser() {
    if (this.form.invalid) return;

    this.loader.show();

    try {
      const value = this.form.getRawValue();

      if (this.isEditMode && this.selectedUserId) {

        // 🔥 UPDATE EXISTING USER
        const { error } = await this.supabase.client
          .from('profiles')
          .update(value)
          .eq('id', this.selectedUserId);

        if (error) throw error;

      } else {

        // 🔥 CREATE NEW USER (NO UPSERT → FIX FOR YOUR ISSUE)
        const { data: authUser } = await this.supabase.client.auth.getUser();
        const { error } = await this.supabase.client
          .from('profiles')
          .insert([{
            id: authUser.user?.id,
            ...value
          }]);

        if (error) throw error;
      }

      this.closeModal();
      this.loadUsers();

    } catch (err) {
      console.error('SAVE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // ================= DELETE =================
  async deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;

    const { error } = await this.supabase.client
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) console.error(error);

    this.loadUsers();
  }

  // ================= TOGGLE STATUS =================
  async toggleStatus(user: any) {

    const { error } = await this.supabase.client
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);

    if (error) console.error(error);

    this.loadUsers();
  }
}