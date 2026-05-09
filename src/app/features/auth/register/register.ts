import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { Auth } from '../../../core/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrl: './register.css',
})

export class Register implements OnInit, OnDestroy {
  registerStatus = false;
  emailVerification = true;
  registerForm!: FormGroup;
  appName: any;
  appLogo: any;
  copyright: any;
  isAssociate = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  strength = 0;
  strengthLabel = 'Weak';

  constructor(private authService: Auth, private fb: FormBuilder, private titleService: TitleService, private formValidator: FormValidationService, private route: ActivatedRoute, private router: Router, private loader: LoaderService) { }

  ngOnInit() {
    const associate = this.route.snapshot.queryParamMap.get('associate');
    const loginProvider = this.route.snapshot.queryParamMap.get('loginProvider');
    const providerDisplayName = this.route.snapshot.queryParamMap.get('providerDisplayName');
    const providerKey = this.route.snapshot.queryParamMap.get('providerKey');
    if (associate && loginProvider && providerDisplayName && providerKey) {
      this.isAssociate = true;
      this.CreateAssociateRegisterForm(associate, loginProvider, providerDisplayName, providerKey);
    } else {
      this.CreateRegisterForm();
    }
    this.titleService.setTitle('Register');
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('register-page');
    this.appName = environment.projectName;
    this.appLogo = environment.logo;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('register-page');
  }

  CreateRegisterForm() {
    this.registerForm = this.fb.group(
      {
        UserName: ['', Validators.required],
        Email: ['', [Validators.required, Validators.email]],
        Password: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
          Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).+/)]],
        ConfirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('Password')?.value === g.get('ConfirmPassword')?.value ? null : { mismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkStrength(event: any) {
    const value = event.target.value;
    let score = 0;
    if (value.length > 5) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[@$!%*?&]/.test(value)) score++;
    this.strength = (score / 4) * 100;
    if (score <= 1) this.strengthLabel = 'Weak';
    else if (score === 2) this.strengthLabel = 'Medium';
    else this.strengthLabel = 'Strong';
  }

  CreateAssociateRegisterForm(as: any, lp: any, pdn: any, pk: any) {
    this.registerForm = this.fb.group({
      UserName: ['', Validators.required],
      Email: [as, [Validators.required, Validators.email]],
      AssociateEmail: ['', [Validators.nullValidator, Validators.email]],
      AssociateExistingAccount: [false, Validators.required],
      LoginProvider: [lp, Validators.required],
      ProviderDisplayName: [pdn, Validators.required],
      ProviderKey: [pk, Validators.required]
    });
  }

  async register() {
    if (this.registerForm.invalid) {
      this.formValidator.validateAllFormFields(this.registerForm);
      return;
    }
    this.loader.show();
    try {
      const res = await this.authService.register(this.registerForm.value);
      this.registerStatus = true;
      this.emailVerification = !res.session;
      if (!res.session) {
        Swal.fire({
          title: 'Verify your email',
          text: 'A confirmation link has been sent to your email.',
          icon: 'info'
        });
      } else {
        this.router.navigate(['/app/dashboard']);
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Registration Failed',
        text: error.message || 'Something went wrong',
        icon: 'error'
      });
    } finally {
      this.loader.hide();
    }
  }
}