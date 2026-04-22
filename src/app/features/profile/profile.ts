import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Auth } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { AppCacheService } from '../../core/services/app-cache.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})

export class Profile implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any;
  profileData: any;
  roles: any[] = [];
  previewUrl: string | null = null;
  activeTab: string = 'profile';
  pro_img = environment.proImg;

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private auth: Auth, private cache: AppCacheService, private loader: LoaderService) { }

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    this.loadUser();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      full_name: [''],
      country: [''],
      gender: [''],
      phone: [''],
      role_id: [null, Validators.required],
      role: ['user'],
      doctor_reg_no: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  async loadRoles() {
    try {
      const { data, error } = await this.supabase.client
        .from('role')
        .select('id, role_name')
        .eq('status', true)
        .order('role_name');

      if (error) throw error;
      this.roles = data || [];
    } catch (err) {
      console.error('ROLE LOAD ERROR:', err);
    }
  }

  async loadUser(): Promise<void> {
    this.loader.show();
    try {
      const user = await this.auth.getUser();
      if (!user) return;
      this.user = user;
      const profile = await this.cache.getProfile(user.id);
      if (!profile) {
        const defaultRole = this.roles.find(r => r.role_name === 'user');
        const { error } = await this.supabase.client
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            is_active: true,
            role_id: defaultRole?.id || null,
            role: 'user'
          });

        if (error) throw error;
        return this.loadUser();
      }
      this.profileData = profile;
      this.profileForm.patchValue({
        username: profile.username || '',
        email: user.email || '',
        full_name: profile.full_name || '',
        country: profile.country || '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        role_id: profile.role_id || null,
        role: profile.role || 'user',
        doctor_reg_no: profile.doctor_reg_no || ''
      });
      this.previewUrl = profile.avatar_url || null;
    } catch (err) {
      console.error('LOAD USER ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.id === roleId);
    return role?.role_name || 'user';
  }

  fileProgress(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    this.loader.show();
    try {
      const user = await this.auth.getUser();
      if (!user) return;
      const data = this.profileForm.getRawValue();
      const roleName = this.getRoleName(data.role_id);
      const payload = {
        id: user.id,
        username: data.username,
        full_name: data.full_name,
        country: data.country,
        gender: data.gender,
        phone: data.phone,
        email: user.email,
        role_id: data.role_id,
        role: roleName,
        doctor_reg_no: data.doctor_reg_no || null,
        avatar_url: this.previewUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase.client
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      alert('Profile updated successfully');
      await this.loadUser();
    } catch (err) {
      console.error('UPDATE ERROR:', err);
      alert('Update failed');
    } finally {
      this.loader.hide();
    }
  }

  async changePassword(): Promise<void> {
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      alert('Password not match');
      return;
    }
    this.loader.show();
    try {
      const { error } = await this.supabase.client.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      alert('Password updated');
      this.passwordForm.reset();
    } catch (err) {
      console.error('PASSWORD ERROR:', err);
      alert('Password update failed');
    } finally {
      this.loader.hide();
    }
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }
}