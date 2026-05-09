import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class IdleService {

    private timeout: any;
    private listenersAdded = false;

    private readonly TIME_LIMIT = 60 * 60 * 1000; // 1 hour

    constructor(
        private router: Router,
        private supabase: SupabaseService,
        private ngZone: NgZone
    ) { }

    // =========================
    // START WATCHING (CALL AFTER LOGIN)
    // =========================
    startWatching() {

        this.resetTimer();

        if (!this.listenersAdded) {
            this.addEventListeners();
            this.listenersAdded = true;
        }
    }

    // =========================
    // EVENTS
    // =========================
    private addEventListeners() {

        const events = [
            'click',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart'
        ];

        events.forEach(event => {
            window.addEventListener(event, () => this.resetTimer());
        });
    }

    // =========================
    // RESET TIMER
    // =========================
    private resetTimer() {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            this.ngZone.run(() => this.logoutUser());
        }, this.TIME_LIMIT);
    }

    // =========================
    // LOGOUT
    // =========================
    private async logoutUser() {

        await this.supabase.signOut();

        this.stopWatching();

        this.router.navigate(['/login']);

        alert('Session expired due to inactivity');
    }

    // =========================
    // STOP WATCHING
    // =========================
    stopWatching() {

        clearTimeout(this.timeout);
        this.timeout = null;
    }
}