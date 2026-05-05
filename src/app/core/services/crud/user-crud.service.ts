import { Injectable } from "@angular/core";
import { CacheService } from "../cache.service";
import { LoaderService } from "../loader.service";
import { SupabaseService } from "../supabase.service";
import { BaseCrudService } from "./base-crud.service";

@Injectable({ providedIn: 'root' })

export class UserCrudService extends BaseCrudService<any> {

    constructor(supabase: SupabaseService, loader: LoaderService, cache: CacheService) {
        super('profiles', supabase, loader, cache);
    }
}