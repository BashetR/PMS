import { CacheService } from '../cache.service';
import { LoaderService } from '../loader.service';

type QueryOptions = {
    forceRefresh?: boolean;
    select?: string;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    ascending?: boolean;
    silent?: boolean;
};

export abstract class BaseCrudService<T extends { id?: number | string }> {
    protected cacheKey: string;
    private inFlight = new Map<string, Promise<any>>();

    constructor(protected table: string, protected supabase: any, protected loader: LoaderService, protected cache: CacheService) {
        this.cacheKey = table;
    }

    async getAll(options: QueryOptions = {}): Promise<T[]> {
        const {
            forceRefresh = false,
            select = '*',
            page,
            pageSize,
            orderBy = 'id',
            ascending = false
        } = options;

        const key = `${this.cacheKey}_${select}_${page}_${pageSize}`;

        if (!forceRefresh) {
            const cached = this.cache.get<T[]>(key);
            if (cached) return cached;
        }

        if (this.inFlight.has(key)) {
            return this.inFlight.get(key)!;
        }

        const request = (async () => {
            let query = this.supabase.client
                .from(this.table)
                .select(select)
                .order(orderBy, { ascending });

            if (page && pageSize) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
            }

            const { data, error } = await query;
            if (error) throw error;
            const result = data || [];
            this.cache.set(key, result, 5 * 60 * 1000);
            return result;
        })();

        this.inFlight.set(key, request);
        try {
            return await request;
        } finally {
            this.inFlight.delete(key);
        }
    }

    async create(payload: Partial<T>): Promise<T> {
        this.loader.show();
        try {
            const { data, error } = await this.supabase.client
                .from(this.table)
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            this.clearCache();
            return data;
        } finally {
            this.loader.hide();
        }
    }

    async update(id: number | string, payload: Partial<T>): Promise<T> {
        this.loader.show();
        try {
            const { data, error } = await this.supabase.client
                .from(this.table)
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            this.clearCache();
            return data;
        } finally {
            this.loader.hide();
        }
    }

    async delete(id: number | string): Promise<boolean> {
        this.loader.show();
        try {
            const { error } = await this.supabase.client
                .from(this.table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            this.clearCache();
            return true;
        } finally {
            this.loader.hide();
        }
    }

    async getById(id: number | string): Promise<T | null> {
        const key = `${this.cacheKey}_id_${id}`;
        const cached = this.cache.get<T>(key);
        if (cached) return cached;
        this.loader.show();
        try {
            const { data, error } = await this.supabase.client
                .from(this.table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            this.cache.set(key, data);
            return data;
        } finally {
            this.loader.hide();
        }
    }

    clearCache() {
        this.cache.removeByPrefix(this.cacheKey);
    }
}