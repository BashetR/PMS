import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseCrudComponent } from '../../shared/base/base-crud.component';
import { CrudModal } from '../../shared/components/crud-modal/crud-modal';
import { CrudTable } from '../../shared/components/crud-table/crud-table';

import { PermissionService } from '../../core/services/permission.service';
import { FormBuilder, Validators } from '@angular/forms';
import { LoaderService } from '../../core/services/loader.service';

/* ================= MODEL ================= */
interface Permission {
  id?: string;
  name: string;
  description?: string;
  is_active: boolean;
}

/* ================= COMPONENT ================= */
@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, CrudModal, CrudTable],
  templateUrl: './permissions.html'
})

export class Permissions extends BaseCrudComponent implements OnInit {
  /* ================= CONFIG ================= */
  config = {
    title: 'Permissions',

    api: {
      getAll: () => this.permissionService.getPermissions(),
      create: (data: Permission) => this.permissionService.createPermission(data),
      update: (id: string, data: Permission) => this.permissionService.updatePermission(id, data),
      delete: (id: string) => this.permissionService.deletePermission(id)
    },

    columns: [
      { field: 'name', label: 'Name' },
      { field: 'description', label: 'Description', hidden: true },
      { field: 'is_active', label: 'Status', type: 'badge' }
    ],

    formFields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  };

  /* ================= CONSTRUCTOR ================= */
  constructor(
    fb: FormBuilder,
    loader: LoaderService,
    private permissionService: PermissionService
  ) {
    super(fb, loader);

    /* ================= FORM ================= */
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      is_active: [true]
    });
  }

  /* ================= INIT ================= */
  async ngOnInit(): Promise<void> {
    await this.loadData();
  }
}