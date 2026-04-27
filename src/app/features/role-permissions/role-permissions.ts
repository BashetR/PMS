import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../core/services/loader.service';
import { RolePermissionService } from '../../core/services/role-permission.service';

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

  constructor(private route: ActivatedRoute, private loader: LoaderService, private service: RolePermissionService) { }

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('roleId');
      if (id) {
        this.selectedRole = Number(id);
      }
      await this.loadInitialData();
    });
  }

  async loadInitialData() {
    this.loader.show();
    try {
      const res = await this.service.getInitialData();
      this.roles = res.roles;
      this.menus = res.menus;
      this.permissions = res.permissions;
    } finally {
      this.loader.hide();
    }
  }

  async onMenuChange() {
    this.filteredPermissions = [];
    this.assignedPermissions.clear();
    if (!this.selectedMenu) return;
    this.loader.show();
    try {
      const permissionIds: any[] =
        await this.service.getMenuPermissions(this.selectedMenu);
      const ids = permissionIds
        .filter((x: any) => x?.permission_id)
        .map((x: any) => x.permission_id);

      this.filteredPermissions = this.permissions.filter(p =>
        ids.includes(p.id)
      );
      await this.loadRoleMappings();
    } finally {
      this.loader.hide();
    }
  }

  async loadRoleMappings() {
    if (!this.selectedRole || !this.selectedMenu) return;
    const data = await this.service.getRoleMappings(
      this.selectedRole,
      this.selectedMenu
    );

    this.assignedPermissions = new Set(
      data.map(x => x.permission_id)
    );
  }

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

  async saveAll() {
    if (!this.selectedRole || !this.selectedMenu) return;
    this.loader.show();
    try {
      await this.service.saveMappings(
        this.selectedRole,
        this.selectedMenu,
        Array.from(this.assignedPermissions)
      );
      alert('Permissions saved successfully');
    } finally {
      this.loader.hide();
    }
  }
}