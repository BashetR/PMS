import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoaderState } from '../../shared/models/loader.model';

@Injectable({
  providedIn: 'root',
})

export class LoaderService {
  private loaderSubject = new BehaviorSubject<LoaderState>({ show: false });
  loaderState$ = this.loaderSubject.asObservable();

  constructor() { }

  show() {
    this.loaderSubject.next({ show: true });
  }

  hide() {
    this.loaderSubject.next({ show: false });
  }

  toggle(state: boolean) {
    this.loaderSubject.next({ show: state });
  }
}