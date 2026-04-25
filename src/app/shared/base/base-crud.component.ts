import { FormBuilder, FormGroup } from '@angular/forms';
import { LoaderService } from '../../core/services/loader.service';

export abstract class BaseCrudComponent {

    data: any[] = [];
    filteredData: any[] = [];

    page = 1;
    pageSize = 5;
    activeTab: 'active' | 'inactive' = 'active';

    form!: FormGroup;

    showModal = false;
    isEditMode = false;
    isViewMode = false;
    selectedId: any = null;

    constructor(
        protected fb: FormBuilder,
        protected loader: LoaderService   // ✅ ADDED
    ) { }

    abstract config: any;

    // ================= LOAD DATA =================
    async loadData() {
        try {
            this.loader.show();   // ✅ GLOBAL LOADER ON

            this.data = await this.config.api.getAll();
            this.applyFilter();

        } catch (err) {
            console.error('LOAD ERROR:', err);

        } finally {
            this.loader.hide();   // ✅ ALWAYS STOP LOADER
        }
    }

    applyFilter() {
        this.filteredData = this.data.filter(x =>
            this.activeTab === 'active'
                ? (x.is_active ?? x.status)
                : !(x.is_active ?? x.status)
        );
    }

    changeTab(tab: 'active' | 'inactive') {
        this.activeTab = tab;
        this.page = 1;
        this.applyFilter();
    }

    // ================= PAGINATION =================
    get paginatedData() {
        const start = (this.page - 1) * this.pageSize;
        return this.filteredData.slice(start, start + this.pageSize);
    }

    get totalPages() {
        return Math.ceil(this.filteredData.length / this.pageSize);
    }

    get totalPagesArray() {
        return Array(this.totalPages).fill(0).map((_, i) => i + 1);
    }

    nextPage() {
        if (this.page < this.totalPages) this.page++;
    }

    prevPage() {
        if (this.page > 1) this.page--;
    }

    goToPage(p: number) {
        this.page = p;
    }

    // ================= MODAL =================
    openCreate() {
        this.isEditMode = false;
        this.isViewMode = false;
        this.selectedId = null;

        this.form.reset();
        this.showModal = true;
    }

    openEdit(row: any) {
        this.isEditMode = true;
        this.isViewMode = false;
        this.selectedId = row.id;

        this.form.patchValue(row);
        this.showModal = true;
    }

    openView(row: any) {
        this.isViewMode = true;
        this.isEditMode = false;

        this.form.patchValue(row);
        this.form.disable();
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.form.enable();
    }

    // ================= SAVE =================
    async save() {
        try {
            this.loader.show();

            const value = this.form.getRawValue();

            if (this.isEditMode) {
                await this.config.api.update(this.selectedId, value);
            } else {
                await this.config.api.create(value);
            }

            await this.loadData();
            this.closeModal();

        } catch (err) {
            console.error('SAVE ERROR:', err);

        } finally {
            this.loader.hide();
        }
    }

    // ================= DELETE =================
    async delete(id: any) {
        if (!confirm('Delete this item?')) return;

        try {
            this.loader.show();

            await this.config.api.delete(id);
            await this.loadData();

        } catch (err) {
            console.error('DELETE ERROR:', err);

        } finally {
            this.loader.hide();
        }
    }
}