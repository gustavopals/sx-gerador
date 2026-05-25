import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PoA11yService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private observer: MutationObserver | null = null;
  private patching = false;

  start(): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;

    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => this.patchDocument());
      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-expanded', 'aria-level', 'aria-checked'],
      });
      this.patchDocument();
    });
  }

  private patchDocument(): void {
    if (this.patching || !this.document.body) return;

    this.patching = true;
    try {
      this.document
        .querySelectorAll('.po-menu[aria-expanded]')
        .forEach((element) => element.removeAttribute('aria-expanded'));

      this.document
        .querySelectorAll('.po-menu-list-item[aria-level]')
        .forEach((element) => element.removeAttribute('aria-level'));

      this.document.querySelectorAll('.po-checkbox').forEach((element) => {
        const checkboxHost = element.closest('.po-checkbox-outline[role="checkbox"]');
        if (checkboxHost && checkboxHost !== element) {
          element.removeAttribute('aria-checked');
          element.removeAttribute('aria-disabled');
          element.removeAttribute('role');
          if (!element.getAttribute('aria-label')?.trim()) element.removeAttribute('aria-label');
          return;
        }

        if (element.hasAttribute('aria-checked')) {
          if (!element.hasAttribute('role')) element.setAttribute('role', 'checkbox');
          if (!element.getAttribute('aria-label')?.trim()) {
            element.setAttribute('aria-label', this.checkboxLabel(element));
          }
        }
      });
    } finally {
      this.patching = false;
    }
  }

  private checkboxLabel(element: Element): string {
    return element.closest('po-checkbox')?.textContent?.trim() || 'Selecionar';
  }
}
