import { Component, OnInit } from '@angular/core';
import { BaseCrudComponent } from '../../shared/base/base-crud.component';
import { FormBuilder } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { CrudTable } from "../../shared/components/crud-table/crud-table";
import { CrudModal } from "../../shared/components/crud-modal/crud-modal";
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  templateUrl: './roles.html',
  imports: [CrudTable, CrudModal, CommonModule]
})
export class Roles extends BaseCrudComponent implements OnInit {

  constructor(
    fb: FormBuilder,
    loader: LoaderService,
    private service: RoleService
  ) {
    super(fb, loader);

    this.form = this.fb.group({
      role_name: [''],
      description: [''],
      status: [true]
    });
  }

  config = {
    title: 'Roles',

    api: {
      getAll: () => this.service.getAll(),
      create: (data: any) => this.service.create(data),
      update: (id: any, data: any) => this.service.update(id, data),
      delete: (id: any) => this.service.delete(id)
    },

    columns: [
      { field: 'role_name', label: 'Role Name' },
      { field: 'description', label: 'Description', hidden: true },
      { field: 'status', label: 'Status', type: 'badge' }
    ],

    formFields: [
      { name: 'role_name', label: 'Role Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Active', type: 'checkbox' }
    ]
  };

  async ngOnInit() {
    await this.loadData();
  }
}