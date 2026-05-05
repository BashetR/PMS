import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { RbacService } from '../../core/services/rbac.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})

export class HasPermissionDirective implements OnInit, OnChanges {
  @Input() appHasPermission: any;
  @Input() appHasAction: string = 'view';
  private hasView = false;

  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef, private rbac: RbacService) { }

  ngOnInit() {
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateView();
  }

  private updateView() {
    if (!this.appHasPermission) return;

    const allowed = this.rbac.hasPermission(
      this.appHasPermission,
      this.appHasAction
    );

    if (allowed && !this.hasView) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    }

    if (!allowed && this.hasView) {
      this.vcr.clear();
      this.hasView = false;
    }
  }
}