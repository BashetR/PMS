import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoaderService } from '../../core/services/loader.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  totalUsers: number = 0;
  user: any = null;
  profile: any = null;

  constructor(
    private userService: UserService,
    private supabase: SupabaseService,
    private router: Router,
    private loader: LoaderService
  ) { }

  async ngOnInit(): Promise<void> {
    this.loader.show();

    try {
      await this.loadUser();
      await this.loadStats();
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // USER (SERVICE DRIVEN)
  // =========================
  async loadUser(): Promise<void> {

    const user = await this.supabase.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = user;

    this.profile = await this.userService.ensureProfile(this.user);
  }

  // =========================
  // STATS (CAN ALSO MOVE TO SERVICE LATER)
  // =========================
  async loadStats(): Promise<void> {

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id');

    if (error) throw error;

    this.totalUsers = data?.length ?? 0;
  }
}