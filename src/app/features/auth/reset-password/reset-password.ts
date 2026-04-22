import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { TitleService } from '../../../core/services/title.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})

export class ResetPassword implements OnInit {
  resetPasswordForm!: FormGroup;
  resetPasswordStatus = false;
  appName: any;
  appLogo: any;
  copyright: any;

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private router: Router, private titleService: TitleService, private formValidator: FormValidationService, private loader: LoaderService) { }

  ngOnInit() {
    this.CreateResetForm();
    this.titleService.setTitle('Reset Password');
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('login-page');
    this.appName = environment.projectName;
    this.appLogo = environment.logo;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('login-page');
  }

  CreateResetForm() {
    this.resetPasswordForm = this.fb.group(
      {
        Password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
        ConfirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    return group.get('Password')?.value === group.get('ConfirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async resetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.formValidator.validateAllFormFields(this.resetPasswordForm);
      return;
    }
    this.loader.show();
    try {
      const password = this.resetPasswordForm.value.Password;

      const { error } = await this.supabase.client.auth.updateUser({
        password: password
      });

      if (error) throw error;
      this.resetPasswordStatus = true;
      Swal.fire({
        title: 'Success',
        text: 'Password updated successfully',
        icon: 'success'
      });

      this.router.navigate(['/login']);
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message,
        icon: 'error'
      });
    } finally {
      this.loader.hide();
    }
  }
}