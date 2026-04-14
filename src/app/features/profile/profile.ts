import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Auth } from '../../core/services/auth.service';

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

  previewUrl: string | null = null;
  activeTab: string = 'profile';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private auth: Auth
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUser();
  }

  // =========================
  // INIT FORMS
  // =========================
  initForm(): void {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', Validators.required],
      country: ['', Validators.required],
      gender: ['', Validators.required],
      phone: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
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

      // CREATE PROFILE IF NOT EXISTS
      if (!profile) {
        const { error: insertError } = await this.supabase.client
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email
          });

        if (insertError) {
          console.error('Profile create error:', insertError);
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
        phone: profile.phone || ''
      });

      this.previewUrl = profile.avatar_url || null;

    } catch (err) {
      console.error('Unexpected error:', err);
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
      .upsert(
        {
          id: user.id,
          username: data.username,
          full_name: data.full_name,
          country: data.country,
          gender: data.gender,
          phone: data.phone,
          email: user.email,
          avatar_url: this.previewUrl
        },
        {
          onConflict: 'id'
        }
      );

    if (error) {
      console.error('Update error:', error);
      alert('Profile update failed');
      return;
    }

    alert('Profile updated successfully');
    await this.loadUser();
  }

  // =========================
  // CHANGE PASSWORD
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
      console.error('Password error:', error);
      alert('Password update failed');
      return;
    }

    alert('Password updated successfully');
    this.passwordForm.reset();
  }

  // =========================
  // TAB SWITCH
  // =========================
  setTab(tab: string): void {
    this.activeTab = tab;
  }
}