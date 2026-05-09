export interface AppCache {
    profile: any | null;
    role: any | null;
    menus: any[];
    permissions: Set<string>;
}