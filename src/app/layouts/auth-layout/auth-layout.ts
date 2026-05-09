import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
// import { routeFadeAnimation } from '../../animations/route-fade.animation';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  // animations: [routeFadeAnimation]
})

export class AuthLayout {
  routeState = 'default';

  // ngAfterViewInit() {
  //   setTimeout(() => {
  //     this.routeState = 'init';
  //   });
  // }

  // getRouteState(outlet: RouterOutlet | null): string {
  //   if (!outlet?.isActivated) return 'default';
  //   const state =
  //     outlet.activatedRouteData?.['animation'] ||
  //     outlet.activatedRoute?.routeConfig?.path ||
  //     'default';
  //   setTimeout(() => {
  //     this.routeState = state;
  //   });
  //   return this.routeState;
  // }
}