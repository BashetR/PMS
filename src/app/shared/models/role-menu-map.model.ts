import { Menu } from './menu.model';

export interface RoleMenuMap {
  menu: Menu | Menu[];
}

export interface RolePermission {
  menu_id: number;
  permission: { name: string } | null;
}