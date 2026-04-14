import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth.service';
import { App } from '../../../app';
import Swal from 'sweetalert2';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { TitleService } from '../../../core/services/title.service';
declare var localStorage: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrl: './login.css',
})

export class Login implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  appLogo: any;
  copyright: any;
  isLoading = false;

  constructor(private authService: Auth, private fb: FormBuilder, private titleService: TitleService, private formValidator: FormValidationService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.CreateLoginForm();
    this.titleService.setTitle('Login');
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('login-page');
    this.appLogo = environment.logo;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('login-page');
  }

  CreateLoginForm() {
    this.loginForm = this.fb.group({
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required]],
    });
  }

  async login() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      try {
        const res = await this.authService.login(this.loginForm.value);

        // ⚠️ Email not verified case (Supabase)
        if (!res.session) {
          Swal.fire({
            title: 'Email not verified',
            text: 'Please verify your email before logging in.',
            icon: 'warning'
          });
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      } catch (error: any) {
        Swal.fire({
          title: 'Login Failed',
          text: error.message || 'Invalid email or password',
          icon: 'error'
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.formValidator.validateAllFormFields(this.loginForm);
    }
  }
}