import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-modal.html',
  styleUrl: './form-modal.css',
})

export class FormModal {
  @Input() title = '';
  @Input() form!: FormGroup;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() canSave = false;
  @Input() visible = false;
  @Output() save = new EventEmitter();
  @Output() close = new EventEmitter();

  submit() {
    if (this.form?.invalid) return;
    this.save.emit();
  }

  onClose() {
    this.visible = false;
    this.close.emit();
  }
}