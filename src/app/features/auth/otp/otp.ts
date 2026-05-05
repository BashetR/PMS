import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.html',
  styleUrls: ['./otp.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})

export class Otp implements OnInit {
  otp: string[] = ['', '', '', '', '', ''];
  otpBoxes = Array(6);
  timer: number = 30;
  interval: any;
  email: string = '';

  constructor(private authService: Auth, private router: Router, private route: ActivatedRoute, private loader: LoaderService) { }

  ngOnInit() {
    const nav = history.state;
    this.email = nav?.email || '';
    this.startTimer();
  }

  onInput(event: any, index: number) {
    const value = event.target.value;
    if (value && index < 5) {
      const next = document.querySelectorAll<HTMLInputElement>('.otp-box')[index + 1];
      next?.focus();
    }

    if (this.isOtpComplete()) {
      this.verifyOtp();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prev = document.querySelectorAll<HTMLInputElement>('.otp-box')[index - 1];
      prev?.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otp.every(x => x !== '');
  }

  async verifyOtp() {
    const code = this.otp.join('');
    this.loader.show();
    try {
      await this.authService.otp(code, this.email);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
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

  async resendOtp() {
    if (this.timer > 0) return;
    await this.authService.sendOtp(this.email);
    this.timer = 30;
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }
}