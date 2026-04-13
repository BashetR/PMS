import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderState } from '../../models/loader.model';
import { LoaderService } from '../../../core/services/loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  imports: [CommonModule],
})

export class Loader implements OnInit, OnDestroy {
  show = false;
  private subscription?: Subscription;

  constructor(public loaderService: LoaderService) { }

  ngOnInit() {
    this.subscription = this.loaderService.loaderState$.subscribe(
      (state: LoaderState) => {
        this.show = state.show;
      }
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}