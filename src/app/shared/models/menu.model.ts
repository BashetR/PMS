export interface Menu {
    children?: Menu[];
    id: number;
    menu_name: string;
    // slug: string;
    parent_id: number;
    route: string;
    order_no: number;
    menu_type: string;
    status: boolean;
    // created_at: string;
    icon: string;
    // updated_at: string;
}