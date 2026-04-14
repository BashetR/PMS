import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
  standalone: true,
  imports: [RouterModule]
})

export class PageNotFound implements OnInit {
  constructor() { }

  ngOnInit() {
  }
}