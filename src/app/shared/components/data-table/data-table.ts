import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})

export class DataTable {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  @Input() emptyText = 'No data found';
  @Output() action = new EventEmitter<any>();

  trigger(action: string, row: any) {
    this.action.emit({ action, row });
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}