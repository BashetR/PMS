import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TitleService } from '../../../core/services/title.service';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './confirm-email.css',
})

export class ConfirmEmail implements OnInit {
  appLogo: any;
  copyright: any;

  constructor(private titleService: TitleService) {}

  ngOnInit() {
    this.titleService.setTitle('Verify Email');
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('lockscreen');

    this.appLogo = environment.logo;
    this.copyright = environment.copyright;
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('lockscreen');
  }
}