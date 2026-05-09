import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RolePermissionService } from '../../core/services/role-permission.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permissions.html',
  styleUrl: './role-permissions.css'
})
export class RolePermissions implements OnInit {

  roles: any[] = [];
  menus: any[] = [];
  permissions: any[] = [];

  filteredPermissions: any[] = [];

  selectedRole: number | null = null;
  selectedMenu: number | null = null;

  assignedPermissions: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private loader: LoaderService,
    private service: RolePermissionService
  ) { }

  async ngOnInit() {
    this.loader.show();

    try {
      const res = await this.service.getInitialData();

      this.roles = res.roles;
      this.menus = res.menus;
      this.permissions = res.permissions;

      // optional preselect role from route
      this.route.paramMap.subscribe(params => {
        const id = params.get('roleId');
        if (id) this.selectedRole = Number(id);
      });

    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // ROLE CHANGE
  // =========================
  onRoleChange() {
    this.loadMatrix();
  }

  // =========================
  // MENU CHANGE
  // =========================
  onMenuChange() {
    this.loadMatrix();
  }

  // =========================
  // CORE RBAC MATRIX LOADER (FIXED)
  // =========================
  async loadMatrix() {

    this.filteredPermissions = [];
    this.assignedPermissions.clear();

    if (!this.selectedRole || !this.selectedMenu) return;

    this.loader.show();

    try {

      // ✅ SHOW ALL permissions (NOT FILTERED)
      this.filteredPermissions = this.permissions;

      // ✅ GET assigned permissions for role+menu
      const rolePerms = await this.service.getRoleMappings(
        this.selectedRole,
        this.selectedMenu
      );

      this.assignedPermissions = new Set(
        rolePerms.map(x => x.permission_id)
      );

    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // CHECKBOX TOGGLE
  // =========================
  togglePermission(id: string, event: any) {
    if (event.target.checked) {
      this.assignedPermissions.add(id);
    } else {
      this.assignedPermissions.delete(id);
    }
  }

  isChecked(id: string): boolean {
    return this.assignedPermissions.has(id);
  }

  // =========================
  // SAVE CHANGES
  // =========================
  async saveAll() {

    if (!this.selectedRole || !this.selectedMenu) return;

    this.loader.show();

    try {

      await this.service.saveMappings(
        this.selectedRole,
        this.selectedMenu,
        Array.from(this.assignedPermissions)
      );

      alert('Permissions updated successfully');

    } finally {
      this.loader.hide();
    }
  }
}