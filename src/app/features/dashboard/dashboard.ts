import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoaderService } from '../../core/services/loader.service';
import { Auth } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {
  totalUsers = 0;
  user: any = null;
  profile: any = null;

  constructor(private auth: Auth, private profileService: ProfileService, private userService: UserService, private router: Router, private loader: LoaderService) { }

  async ngOnInit(): Promise<void> {
    try {
      await this.loadUser();
      await this.loadStats();
    } catch (err) {
      console.error('DASHBOARD ERROR:', err);
    }
  }

  async loadUser(): Promise<void> {
    const user = await this.auth.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = user;
    try {
      this.profile = await this.profileService.getProfile();
    } catch (err) {
      console.error('PROFILE ERROR:', err);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const users = await this.userService.getUsers();
      this.totalUsers = users.length;
    } catch (err) {
      console.error('STATS ERROR:', err);
    }
  }
}