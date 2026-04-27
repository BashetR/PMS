import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { LoaderService } from '../../core/services/loader.service';
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
  roles: any[] = [];

  previewUrl: string | null = null;
  activeTab: string = 'profile';

  pro_img = environment.proImg;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private userService: UserService,
    private roleService: RoleService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.initData();
  }

  // =========================
  // INIT DATA
  // =========================
  async initData() {

    this.loader.show();

    try {
      const user = await this.auth.getUser();
      if (!user) return;

      this.user = user;

      this.roles = await this.roleService.getActiveRoles();

      this.profileData = await this.userService.ensureProfile(user);

      this.patchForm();

    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // FORM
  // =========================
  initForm(): void {
    this.profileForm = this.fb.group({
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      full_name: [''],
      country: [''],
      gender: [''],
      phone: [''],
      role_id: [null, Validators.required],
      doctor_reg_no: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  // =========================
  // PATCH FORM
  // =========================
  patchForm() {
    this.profileForm.patchValue({
      username: this.profileData.username || '',
      email: this.user.email || '',
      full_name: this.profileData.full_name || '',
      country: this.profileData.country || '',
      gender: this.profileData.gender || '',
      phone: this.profileData.phone || '',
      role_id: this.profileData.role_id || null,
      doctor_reg_no: this.profileData.doctor_reg_no || ''
    });

    this.previewUrl = this.profileData.avatar_url || null;
  }

  // =========================
  // ROLE NAME
  // =========================
  getRoleName(roleId: number): string {
    return this.roles.find(r => r.id === roleId)?.role_name || 'user';
  }

  // =========================
  // FILE PREVIEW
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

    this.loader.show();

    try {

      const data = this.profileForm.getRawValue();

      const payload = {
        id: this.user.id,
        username: data.username,
        full_name: data.full_name,
        country: data.country,
        gender: data.gender,
        phone: data.phone,
        email: this.user.email,
        role_id: data.role_id,
        role: this.getRoleName(data.role_id),
        doctor_reg_no: data.doctor_reg_no || null,
        avatar_url: this.previewUrl,
        updated_at: new Date().toISOString()
      };

      await this.userService.updateUser(this.user.id, payload);

      alert('Profile updated successfully');

      this.profileData = await this.userService.getUserById(this.user.id);

    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // PASSWORD CHANGE
  // =========================
  async changePassword(): Promise<void> {

    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      alert('Password not match');
      return;
    }

    this.loader.show();

    try {
      await this.auth.updatePassword(newPassword);

      alert('Password updated');

      this.passwordForm.reset();

    } finally {
      this.loader.hide();
    }
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }
}