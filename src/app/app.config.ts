// import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { routes } from './app.routes';
// import { DatePipe } from '@angular/common';
// import { HTTP_INTERCEPTORS } from '@angular/common/http';
// import { LoaderInterceptorService } from './_services/loader-interceptor.service';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     DatePipe,
//     provideBrowserGlobalErrorListeners(),
//     provideRouter(routes),
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: LoaderInterceptorService,
//       multi: true
//     }
//   ]
// };
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { LoaderInterceptor } from './core/interceptors/loader-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    }
  ]
};