import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  profiles: any[] = [];

  form: any = {
    id: null,
    full_name: '',
    email: '',
    role: 'user',
    is_active: true
  };

  isEdit = false;

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.loadProfiles();
  }

  // 🔥 READ
  async loadProfiles() {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    this.profiles = data || [];
  }

  // 🔥 CREATE
  async createProfile() {
    const { error } = await this.supabase.client
      .from('profiles')
      .insert([this.form]);

    if (error) console.error(error);

    this.resetForm();
    this.loadProfiles();
  }

  // 🔥 UPDATE
  async updateProfile() {
    const { error } = await this.supabase.client
      .from('profiles')
      .update(this.form)
      .eq('id', this.form.id);

    if (error) console.error(error);

    this.resetForm();
    this.loadProfiles();
  }

  // 🔥 DELETE
  async deleteProfile(id: string) {
    if (!confirm('Delete this profile?')) return;

    const { error } = await this.supabase.client
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) console.error(error);

    this.loadProfiles();
  }

  // ✏️ EDIT MODE
  edit(profile: any) {
    this.form = { ...profile };
    this.isEdit = true;
  }

  // 🔄 RESET FORM
  resetForm() {
    this.form = {
      id: null,
      full_name: '',
      email: '',
      role: 'user',
      is_active: true
    };
    this.isEdit = false;
  }
}