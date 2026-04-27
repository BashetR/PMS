import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  imports: [CommonModule],
})

export class Loader {

  constructor(public loaderService: LoaderService) { }

  get loader$() {
    return this.loaderService.loaderState$;
  }
}