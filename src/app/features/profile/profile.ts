import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Auth } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

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

  roles: any[] = [];   // ✅ ROLE LIST

  previewUrl: string | null = null;
  activeTab: string = 'profile';
  pro_img = environment.proImg;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private auth: Auth
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUser();
    this.loadRoles(); // ✅ LOAD ROLES
  }

  // =========================
  // INIT FORMS
  // =========================
  initForm(): void {
    this.profileForm = this.fb.group({
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      full_name: [''],
      country: [''],
      gender: [''],
      phone: [''],

      // ✅ ROLE FIELD
      role: ['', Validators.required],

      doctor_reg_no: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  // =========================
  // LOAD ROLES FROM DB
  // =========================
  async loadRoles() {
    const { data, error } = await this.supabase.client
      .from('role')
      .select('id, role_name')
      .eq('status', true)
      .order('role_name', { ascending: true });

    if (!error) {
      this.roles = data || [];
    } else {
      console.error('Role load error:', error);
    }
  }

  // =========================
  // LOAD USER + PROFILE
  // =========================
  async loadUser(): Promise<void> {
    try {
      const user = await this.auth.getUser();
      if (!user) return;

      this.user = user;

      const { data: profile, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error);
        return;
      }

      // CREATE IF NOT EXISTS
      if (!profile) {
        const { error: insertError } = await this.supabase.client
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: null,
            is_active: true
          });

        if (insertError) {
          console.error(insertError);
          return;
        }

        return this.loadUser();
      }

      this.profileData = profile;

      // PATCH FORM
      this.profileForm.patchValue({
        username: profile.username || '',
        email: user.email || '',
        full_name: profile.full_name || '',
        country: profile.country || '',
        gender: profile.gender || '',
        phone: profile.phone || '',
        role: profile.role || '',          // ✅ ROLE
        doctor_reg_no: profile.doctor_reg_no || ''
      });

      this.previewUrl = profile.avatar_url || null;

    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // IMAGE PREVIEW
  // =========================
  fileProgress(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // =========================
  // UPDATE PROFILE
  // =========================
  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    const user = await this.auth.getUser();
    if (!user) return;

    const data = this.profileForm.value;

    const { error } = await this.supabase.client
      .from('profiles')
      .upsert({
        id: user.id,

        username: data.username,
        full_name: data.full_name,
        country: data.country,
        gender: data.gender,
        phone: data.phone,

        email: user.email,

        // ✅ ROLE SAVE
        role: data.role,

        doctor_reg_no: data.doctor_reg_no || null,

        avatar_url: this.previewUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error(error);
      alert('Update failed');
      return;
    }

    alert('Profile updated');
    this.loadUser();
  }

  // =========================
  // PASSWORD
  // =========================
  async changePassword(): Promise<void> {
    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      alert('Password not match');
      return;
    }

    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert('Password update failed');
      return;
    }

    alert('Password updated');
    this.passwordForm.reset();
  }

  // =========================
  // TAB
  // =========================
  setTab(tab: string): void {
    this.activeTab = tab;
  }
}