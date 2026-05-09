import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.css',
})

export class Unauthorized {
  constructor(private router: Router) { }

  goToDashboard() {
    this.router.navigate(['/app/dashboard']);
  }

  goBack() {
    history.back();
  }
}