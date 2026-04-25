import { Component, OnInit } from '@angular/core';
import { BaseCrudComponent } from '../../shared/base/base-crud.component';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';
import { CrudModal } from '../../shared/components/crud-modal/crud-modal';
import { CrudTable } from '../../shared/components/crud-table/crud-table';
import { LoaderService } from '../../core/services/loader.service';

type SelectOption = {
  id: string | number;
  name: string;
};

type FormField = {
  name: string;
  label: string;
  type: string;
  hidden?: boolean;
  options?: SelectOption[];   // ✅ FIX HERE
};

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  imports: [CrudTable, CrudModal, CommonModule]
})
export class Users extends BaseCrudComponent implements OnInit {

  roles: any[] = [];

  constructor(
    fb: FormBuilder,
    loader: LoaderService,
    private service: UserService,
    private supabase: SupabaseService
  ) {
    super(fb, loader);

    this.form = this.fb.group({
      full_name: [''],
      email: [''],
      role_id: [null],
      is_active: [true]
    });
  }

  config: {
    title: string;
    api: any;
    columns: any[];
    formFields: FormField[];
  } = {
    title: 'Users',

    api: {
      getAll: () => this.service.getUsers(),
      create: (data: any) => this.service.createUser(data),
      update: (id: any, data: any) => this.service.updateUser(id, data),
      delete: (id: any) => this.service.deleteUser(id)
    },

    columns: [
      { field: 'full_name', label: 'Name' },
      { field: 'email', label: 'Email', hidden: true },
      { field: 'role_name', label: 'Role' },
      { field: 'is_active', label: 'Status', type: 'badge' }
    ],

    formFields: [
      { name: 'full_name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },

      {
        name: 'role_id',
        label: 'Role',
        type: 'select',
        options: []   // ✅ now correctly typed
      },

      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  };

  async ngOnInit() {
    await this.loadRoles();
    await this.loadData();
  }

  async loadRoles() {
    const { data } = await this.supabase.client
      .from('role')
      .select('*')
      .eq('status', true);

    this.roles = data || [];

    const roleField = this.config.formFields.find(f => f.name === 'role_id');

    if (roleField) {
      roleField.options = this.roles.map(r => ({
        id: r.id,
        name: r.role_name
      }));
    }
  }
}