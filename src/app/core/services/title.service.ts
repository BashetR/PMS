import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })

export class TitleService {

    constructor(private title: Title) { }

    setTitle(page?: string): void {
        const safePage = page?.trim() || '';

        if (!safePage) {
            this.title.setTitle(environment.projectName);
            return;
        }

        this.title.setTitle(`${safePage} | ${environment.projectName}`);
    }

    resetTitle(): void {
        this.title.setTitle(environment.projectName);
    }
}