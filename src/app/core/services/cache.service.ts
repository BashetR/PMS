import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type CacheItem = {
    value: any;
    expiry: number | null;
};

@Injectable({ providedIn: 'root' })

export class CacheService {
    private store: Record<string, CacheItem> = {};
    private subject = new BehaviorSubject<Record<string, any>>({});
    cache$ = this.subject.asObservable();

    set(key: string, value: any, ttlMs?: number) {
        const expiry = ttlMs ? Date.now() + ttlMs : null;
        const item: CacheItem = { value, expiry };
        this.store[key] = item;
        localStorage.setItem(key, JSON.stringify(item));
        this.emit();
    }

    get<T>(key: string): T | null {
        const item = this.store[key] || this.getFromStorage(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.remove(key);
            return null;
        }
        return item.value;
    }

    private getFromStorage(key: string): CacheItem | null {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            this.store[key] = parsed;
            return parsed;
        } catch {
            return null;
        }
    }

    remove(key: string) {
        delete this.store[key];
        localStorage.removeItem(key);
        this.emit();
    }

    clear() {
        this.store = {};
        localStorage.clear();
        this.emit();
    }

    removeByPrefix(prefix: string) {
        Object.keys(this.store).forEach(key => {
            if (key.startsWith(prefix)) {
                this.remove(key);
            }
        });
    }

    private emit() {
        const plain: Record<string, any> = {};
        Object.keys(this.store).forEach(k => {
            plain[k] = this.store[k].value;
        });
        this.subject.next(plain);
    }
}