import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import Swal from 'sweetalert2';
import { LoaderService } from '../../../core/services/loader.service';
import { MedicineService } from '../../../core/services/medicine_setup/medicine.service';
import { PermissionService } from '../../../core/services/permission.service';

declare var bootstrap: any;

@Component({
  selector: 'app-medicine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './medicine.html',
  styleUrl: './medicine.css'
})
export class Medicine implements OnInit, AfterViewInit {

  medicines: any[] = [];

  generics: any[] = [];
  dosageForms: any[] = [];
  manufacturers: any[] = [];

  medicineTypes = [
    'Homeopathy',
    'Ayurveda',
    'Allopathic'
  ];

  activeTab = 'active';

  page = 1;
  pageSize = 10;

  form!: FormGroup;

  isEditMode = false;
  isViewMode = false;

  selectedId: number | null = null;

  private modalInstance: any;

  userMenuId = 15;

  constructor(
    private medicineService: MedicineService,
    private permission: PermissionService,
    private loader: LoaderService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  async ngOnInit() {

    await Promise.all([
      this.loadMedicines(),
      this.loadDropdowns()
    ]);
  }

  ngAfterViewInit() {

    const modal =
      document.getElementById(
        'medicineModal'
      );

    if (modal) {

      this.modalInstance =
        new bootstrap.Modal(modal, {
          backdrop: 'static',
          keyboard: false
        });
    }
  }

  can(action: string) {
    return this.permission.has(
      this.userMenuId,
      action
    );
  }

  initForm() {

    this.form = this.fb.group({

      medicine_name: [
        '',
        Validators.required
      ],

      generic_id: [
        null,
        Validators.required
      ],

      dosage_form_id: [
        null,
        Validators.required
      ],

      manufacturer_id: [
        null,
        Validators.required
      ],

      medicine_type: [
        '',
        Validators.required
      ],

      is_active: [true]
    });
  }

  async loadDropdowns() {

    this.generics =
      await this.medicineService
        .getGenerics();

    this.dosageForms =
      await this.medicineService
        .getDosageForms();

    this.manufacturers =
      await this.medicineService
        .getManufacturers();
  }

  async loadMedicines() {

    this.loader.show();

    try {

      this.medicines =
        await this.medicineService
          .getMedicines();

      this.page = 1;

    } finally {

      this.loader.hide();
    }
  }

  get filteredMedicines() {

    return this.medicines.filter(x =>
      this.activeTab === 'active'
        ? x.is_active
        : !x.is_active
    );
  }

  get paginatedMedicines() {

    const start =
      (this.page - 1) *
      this.pageSize;

    return this.filteredMedicines.slice(
      start,
      start + this.pageSize
    );
  }

  get totalPages() {

    return Math.ceil(
      this.filteredMedicines.length /
      this.pageSize
    );
  }

  get totalPagesArray() {

    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  openCreateModal() {

    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedId = null;

    this.form.reset({
      is_active: true
    });

    this.form.enable();

    this.modalInstance.show();
  }

  openEditModal(row: any) {

    this.isEditMode = true;
    this.isViewMode = false;

    this.selectedId = row.id;

    this.form.patchValue({
      medicine_name: row.medicine_name,
      generic_id: row.generic_id,
      dosage_form_id: row.dosage_form_id,
      manufacturer_id: row.manufacturer_id,
      medicine_type: row.medicine_type,
      is_active: row.is_active
    });

    this.form.enable();

    this.modalInstance.show();
  }

  openViewModal(row: any) {

    this.openEditModal(row);

    this.isViewMode = true;

    this.form.disable();
  }

  closeModal() {
    this.modalInstance.hide();
  }

  async save() {

    if (this.form.invalid)
      return;

    this.loader.show();

    try {

      const payload =
        this.form.getRawValue();

      if (
        this.isEditMode &&
        this.selectedId
      ) {

        await this.medicineService
          .updateMedicine(
            this.selectedId,
            payload
          );

        Swal.fire(
          'Updated',
          'Medicine updated',
          'success'
        );

      } else {

        await this.medicineService
          .createMedicine(payload);

        Swal.fire(
          'Created',
          'Medicine created',
          'success'
        );
      }

      await this.loadMedicines();

      this.closeModal();

    } finally {
      this.loader.hide();
    }
  }

  async deleteMedicine(id: number) {

    await this.medicineService
      .deleteMedicine(id);

    await this.loadMedicines();
  }

  confirmDelete(row: any) {

    Swal.fire({
      title: 'Delete?',
      text: row.medicine_name,
      icon: 'warning',
      showCancelButton: true
    }).then(result => {

      if (result.isConfirmed) {
        this.deleteMedicine(row.id);
      }
    });
  }

  changeTab(tab: string) {
    this.activeTab = tab;
  }

  goToPage(page: number) {
    this.page = page;
  }

  nextPage() {
    if (this.page < this.totalPages)
      this.page++;
  }

  prevPage() {
    if (this.page > 1)
      this.page--;
  }
}