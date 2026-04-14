import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })

export class TitleService {
    constructor(private title: Title) { }

    setTitle(page: string) {
        this.title.setTitle(`${page} | ${environment.projectName}`);
    }
}