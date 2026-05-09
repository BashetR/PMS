import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
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
  activeTab = 'profile';
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

      this.profileData =
        await this.userService.ensureProfile(user);

      this.patchForm();

    } catch (err) {

      console.error(err);

      Swal.fire(
        'Error',
        'Failed to load profile',
        'error'
      );

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

      email: [
        '',
        [Validators.required, Validators.email]
      ],

      full_name: [''],

      website: [''],

      country: [''],

      gender: [''],

      phone: [''],

      role_id: [null],

      doctor_reg_no: ['']

    });

    this.passwordForm = this.fb.group({

      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      confirmPassword: [
        '',
        Validators.required
      ]

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

      website: this.profileData.website || '',

      country: this.profileData.country || '',

      gender: this.profileData.gender || '',

      phone: this.profileData.phone || '',

      role_id: this.profileData.role_id || null,

      doctor_reg_no:
        this.profileData.doctor_reg_no || ''

    });

    this.previewUrl =
      this.profileData.avatar_url || null;
  }

  // =========================
  // ROLE NAME
  // =========================
  getRoleName(roleId: number): string {

    return (
      this.roles.find(r => r.id === roleId)
        ?.role_name || '-'
    );
  }

  // =========================
  // FILE PREVIEW
  // =========================
  fileProgress(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    // FILE VALIDATION
    if (!file.type.startsWith('image/')) {

      Swal.fire(
        'Invalid File',
        'Please select image file',
        'warning'
      );

      return;
    }

    // MAX 2MB
    if (file.size > 2 * 1024 * 1024) {

      Swal.fire(
        'Too Large',
        'Max image size is 2MB',
        'warning'
      );

      return;
    }

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

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();

      return;
    }

    this.loader.show();

    try {

      const data =
        this.profileForm.getRawValue();

      const payload = {

        username: data.username,

        full_name: data.full_name,

        website: data.website,

        country: data.country,

        gender: data.gender,

        phone: data.phone,

        role_id: data.role_id || null,

        doctor_reg_no:
          data.doctor_reg_no || null,

        avatar_url: this.previewUrl

      };

      await this.userService.updateUser(
        this.user.id,
        payload
      );

      Swal.fire(
        'Success',
        'Profile updated successfully',
        'success'
      );

      this.profileData =
        await this.userService.getUserById(
          this.user.id
        );

    } catch (err: any) {

      console.error(err);

      Swal.fire(
        'Error',
        err?.message || 'Update failed',
        'error'
      );

    } finally {

      this.loader.hide();
    }
  }

  // =========================
  // CHANGE PASSWORD
  // =========================
  async changePassword(): Promise<void> {

    if (this.passwordForm.invalid) {

      this.passwordForm.markAllAsTouched();

      return;
    }

    const {
      newPassword,
      confirmPassword
    } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {

      Swal.fire(
        'Error',
        'Password does not match',
        'error'
      );

      return;
    }

    this.loader.show();

    try {

      await this.auth.updatePassword(
        newPassword
      );

      Swal.fire(
        'Success',
        'Password updated',
        'success'
      );

      this.passwordForm.reset();

    } catch (err: any) {

      console.error(err);

      Swal.fire(
        'Error',
        err?.message || 'Password update failed',
        'error'
      );

    } finally {

      this.loader.hide();
    }
  }

  // =========================
  // TAB
  // =========================
  setTab(tab: string): void {

    this.activeTab = tab;
  }
}