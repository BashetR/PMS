import { Injectable } from "@angular/core";
import { SupabaseService } from "../supabase.service";
import { BaseCrudService } from "./base-crud.service";
import { LoaderService } from "../loader.service";
import { CacheService } from "../cache.service";

@Injectable({ providedIn: 'root' })

export class RoleCrudService extends BaseCrudService<any> {

    constructor(supabase: SupabaseService, loader: LoaderService, cache: CacheService) {
        super('role', supabase, loader, cache);
    }
}