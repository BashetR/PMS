import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class IdleService {

    private timeout: any;
    private readonly TIME_LIMIT = 60 * 60 * 1000; // 1 hour

    constructor(
        private router: Router,
        private supabase: SupabaseService,
        private ngZone: NgZone
    ) { }

    startWatching() {
        this.resetTimer();

        // user activity events
        ['click', 'mousemove', 'keydown', 'scroll', 'touchstart']
            .forEach(event => {
                window.addEventListener(event, () => this.resetTimer());
            });
    }

    private resetTimer() {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            this.ngZone.run(() => this.logoutUser());
        }, this.TIME_LIMIT);
    }

    private async logoutUser() {
        await this.supabase.signOut();
        this.router.navigate(['/login']);

        alert('Session expired due to inactivity');
    }

    stopWatching() {
        clearTimeout(this.timeout);
    }
}