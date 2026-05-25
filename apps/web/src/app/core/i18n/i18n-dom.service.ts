import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Injector, NgZone } from '@angular/core';
import { I18nService } from './i18n.service';

const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'title', 'placeholder'];
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'CODE',
  'PRE',
]);

@Injectable({ providedIn: 'root' })
export class I18nDomService {
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private observer: MutationObserver | null = null;
  private translating = false;

  start(): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;

    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => {
        if (!this.translating) this.translateDocument();
      });
      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRIBUTES,
      });
      this.translateDocument();
    });

    effect(
      () => {
        this.i18n.language();
        this.translateDocument();
      },
      { injector: this.injector },
    );
  }

  private translateDocument(): void {
    if (!this.document.body) return;
    this.translating = true;
    try {
      const walker = this.document.createTreeWalker(this.document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          this.canTranslateTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      });

      let current = walker.nextNode();
      while (current) {
        this.translateTextNode(current as Text);
        current = walker.nextNode();
      }

      for (const element of Array.from(this.document.body.querySelectorAll('*'))) {
        this.translateAttributes(element);
      }
    } finally {
      this.translating = false;
    }
  }

  private canTranslateTextNode(node: Node): boolean {
    const parent = node.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return false;
    if (parent.closest('[data-sxg-no-translate]')) return false;
    return Boolean(node.textContent?.trim());
  }

  private translateTextNode(node: Text): void {
    const current = node.textContent ?? '';
    const original = this.originalText.get(node) ?? current;
    this.originalText.set(node, original);

    const translated = translatePreservingWhitespace(original, (value) => this.i18n.phrase(value));
    if (node.textContent !== translated) node.textContent = translated;
  }

  private translateAttributes(element: Element): void {
    if (SKIP_TAGS.has(element.tagName) || element.closest('[data-sxg-no-translate]')) return;

    let originals = this.originalAttributes.get(element);
    if (!originals) {
      originals = new Map();
      this.originalAttributes.set(element, originals);
    }

    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (!value?.trim()) continue;
      if (!originals.has(attribute)) originals.set(attribute, value);
      const original = originals.get(attribute) ?? value;
      const translated = translatePreservingWhitespace(original, (text) => this.i18n.phrase(text));
      if (value !== translated) element.setAttribute(attribute, translated);
    }
  }
}

function translatePreservingWhitespace(
  value: string,
  translate: (trimmed: string) => string,
): string {
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const trimmed = value.trim();
  return `${leading}${translate(trimmed)}${trailing}`;
}
