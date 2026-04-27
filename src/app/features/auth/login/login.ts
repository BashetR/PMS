import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { TitleService } from '../../../core/services/title.service';
import { LoaderService } from '../../../core/services/loader.service';

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

  constructor(
    private authService: Auth,
    private fb: FormBuilder,
    private titleService: TitleService,
    private formValidator: FormValidationService,
    private route: ActivatedRoute,
    private router: Router,
    private loader: LoaderService
  ) { }

  ngOnInit() {
    this.createLoginForm();
    this.titleService.setTitle('Login');

    document.body.classList.add('login-page');

    this.appLogo = environment.logo;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    document.body.classList.remove('login-page');
  }

  createLoginForm() {
    this.loginForm = this.fb.group({
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required]],
    });
  }

  // =========================
  // LOGIN (FIXED FLOW)
  // =========================
  async login() {

    if (this.loginForm.invalid) {
      this.formValidator.validateAllFormFields(this.loginForm);
      return;
    }

    this.loader.show();

    try {

      await this.authService.login(this.loginForm.value);

      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

      this.router.navigateByUrl(returnUrl);

    } catch (error: any) {

      Swal.fire({
        title: 'Login Failed',
        text: error.message || 'Invalid email or password',
        icon: 'error'
      });

    } finally {
      this.loader.hide();
    }
  }
}