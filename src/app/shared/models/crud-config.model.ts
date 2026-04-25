export interface CrudConfig {

    title: string;

    api: {
        getAll: () => Promise<any[]>;
        create: (data: any) => Promise<any>;
        update: (id: any, data: any) => Promise<any>;
        delete: (id: any) => Promise<any>;
    };

    columns: Array<{
        field: string;
        label: string;
        hidden?: boolean;
        type?: string;
    }>;

    formFields: Array<{
        name: string;
        label: string;
        type: string;
        options?: any[];
    }>;
}