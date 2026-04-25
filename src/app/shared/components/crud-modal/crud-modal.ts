import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-crud-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crud-modal.html'
})
export class CrudModal {

  @Input() show = false;
  @Input() title = '';
  @Input() form!: FormGroup;
  @Input() fields: any[] = [];
  @Input() isViewMode = false;
  @Input() isEditMode = false;

  @Output() close = new EventEmitter();
  @Output() save = new EventEmitter();

  // 👇 For custom template support (like permissions UI)
  // @Input() customTemplate: any;
  @ContentChild('customTemplate') customTemplate!: TemplateRef<any>;

  onSave() {
    this.save.emit();
  }

  onClose() {
    this.close.emit();
  }
}