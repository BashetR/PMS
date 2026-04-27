import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {

  private requestCount = 0;

  private loaderSubject = new BehaviorSubject<boolean>(false);
  loaderState$ = this.loaderSubject.asObservable();

  // =========================
  // SHOW LOADER
  // =========================
  show(): void {
    this.requestCount++;

    if (this.requestCount === 1) {
      this.loaderSubject.next(true);
    }
  }

  // =========================
  // HIDE LOADER
  // =========================
  hide(): void {
    if (this.requestCount > 0) {
      this.requestCount--;
    }

    if (this.requestCount === 0) {
      this.loaderSubject.next(false);
    }
  }

  // =========================
  // FORCE STOP (SAFE RESET)
  // =========================
  forceStop(): void {
    this.requestCount = 0;
    this.loaderSubject.next(false);
  }

  // =========================
  // OPTIONAL: CURRENT STATE
  // =========================
  get isLoading(): boolean {
    return this.requestCount > 0;
  }
}