import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CacheService {

    // Use plain object instead of Map for reactivity safety
    private store: Record<string, any> = {};

    private subject = new BehaviorSubject<Record<string, any>>({ ...this.store });
    cache$ = this.subject.asObservable();

    // =========================
    // SET CACHE (immutable update)
    // =========================
    set(key: string, value: any) {
        this.store = {
            ...this.store,
            [key]: value
        };

        this.subject.next({ ...this.store });
    }

    // =========================
    // GET CACHE
    // =========================
    get<T>(key: string): T | null {
        return this.store[key] ?? null;
    }

    // =========================
    // UPDATE CACHE
    // =========================
    update(key: string, updater: (old: any) => any) {
        const oldValue = this.store[key];
        const newValue = updater(oldValue);

        this.set(key, newValue);
    }

    // =========================
    // REMOVE KEY
    // =========================
    remove(key: string) {
        const { [key]: _, ...rest } = this.store;

        this.store = rest;
        this.subject.next({ ...this.store });
    }

    // =========================
    // CLEAR ALL
    // =========================
    clear() {
        this.store = {};
        this.subject.next({});
    }
}