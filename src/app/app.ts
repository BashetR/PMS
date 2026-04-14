import { Component, signal } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Loader } from "./shared/components/loader/loader";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [RouterOutlet, Loader],
  styleUrl: './app.css',
})

export class App {
  protected readonly title = signal('UI');
}