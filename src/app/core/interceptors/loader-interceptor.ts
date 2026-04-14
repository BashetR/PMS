import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Injectable({
    providedIn: 'root'
})

export class LoaderInterceptor implements HttpInterceptor {

    constructor(private loaderService: LoaderService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.includes('auth') || req.url.includes('supabase')) {
            return next.handle(req);
        }

        this.loaderService.show();

        return next.handle(req).pipe(
            finalize(() => {
                this.loaderService.hide();
            })
        );
    }
}