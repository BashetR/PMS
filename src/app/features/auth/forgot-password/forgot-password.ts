import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { App } from '../../../app';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { TitleService } from '../../../core/services/title.service';
import { FormValidationService } from '../../../core/services/form-validation.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})

export class ForgotPassword implements OnInit {
  forgotPasswordForm!: FormGroup;
  forgotPasswordStatus = false;
  appName: any;
  copyright: any;
  appLogo: any;
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private titleService: TitleService, private formValidator: FormValidationService) { }

  ngOnInit() {
    this.CreateForgotPasswordForm();
    this.titleService.setTitle('Forgot Password');
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('login-page');
    this.appLogo = environment.logo;
    this.appName = environment.projectName;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('login-page');
  }

  CreateForgotPasswordForm() {
    this.forgotPasswordForm = this.fb.group({
      Email: ['', [Validators.required, Validators.email]],
    });
  }

  async forgotPassword() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      try {
        const email = this.forgotPasswordForm.value.Email;
        const { error } = await this.supabase.client.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: environment.authRedirectUrl
          }
        );

        if (error) throw error;
        this.forgotPasswordStatus = true;
        Swal.fire({
          title: 'Email Sent',
          text: 'Check your email to reset your password.',
          icon: 'success'
        });
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.message,
          icon: 'error'
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.formValidator.validateAllFormFields(this.forgotPasswordForm);
    }
  }
}