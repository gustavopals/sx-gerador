import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  PoTabsModule,
  type PoBreadcrumb,
  type PoPageAction,
  type PoSelectOption,
} from '@po-ui/ng-components';
import type { CreateFieldInput, UpdateFieldInput } from '@sxgerador/shared-types';
import { mapFieldsError } from '../../../../core/services/fields.service';
import { TablesService } from '../../../../core/services/tables.service';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor.component';
import { ComboboxEditorComponent } from '../../../../shared/components/combobox-editor/combobox-editor.component';
import { ModulesEditorComponent } from '../../../../shared/components/modules-editor/modules-editor.component';
import { UsadoEditorComponent } from '../../../../shared/components/usado-editor/usado-editor.component';
import { FieldsStore } from '../../../../stores/fields.store';

const FIELD_SUFFIX_PATTERN = /^[A-Z0-9_]{1,6}$/;
const FIELD_TYPES: PoSelectOption[] = [
  { label: 'Caractere (C)', value: 'C' },
  { label: 'Numérico (N)', value: 'N' },
  { label: 'Data (D)', value: 'D' },
  { label: 'Memo (M)', value: 'M' },
  { label: 'Lógico (L)', value: 'L' },
];
const YES_NO_OPTIONS: PoSelectOption[] = [
  { label: 'Sim', value: 'S' },
  { label: 'Não', value: 'N' },
];
const VISUAL_MODE_OPTIONS: PoSelectOption[] = [
  { label: 'View (V)', value: 'V' },
  { label: 'Alter (A)', value: 'A' },
  { label: 'ReadOnly (R)', value: 'R' },
];
const CONTEXT_MODE_OPTIONS: PoSelectOption[] = [
  { label: 'Real (R)', value: 'R' },
  { label: 'Virtual (V)', value: 'V' },
];
const PICTURE_SUGGESTIONS: PoSelectOption[] = [
  { label: '@! (texto padrão)', value: '@!' },
  { label: '@E 999.999,99 (numérico)', value: '@E 999.999,99' },
  { label: '@D (data)', value: '@D' },
];

@Component({
  selector: 'sxg-field-form',
  imports: [
    ReactiveFormsModule,
    PoButtonModule,
    PoFieldModule,
    PoPageModule,
    PoTabsModule,
    ComboboxEditorComponent,
    CodeEditorComponent,
    ModulesEditorComponent,
    UsadoEditorComponent,
  ],
  templateUrl: './field-form.component.html',
  styleUrl: './field-form.component.scss',
})
export class FieldFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tablesService = inject(TablesService);
  private readonly fieldsStore = inject(FieldsStore);
  private readonly notification = inject(PoNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = signal('');
  readonly tableId = signal('');
  readonly fieldId = signal<string | null>(null);
  readonly tablePrefix = signal('');
  readonly isEditMode = computed(() => this.fieldId() !== null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly submitType = PoButtonType.Submit;
  readonly fieldTypeOptions = FIELD_TYPES;
  readonly yesNoOptions = YES_NO_OPTIONS;
  readonly visualModeOptions = VISUAL_MODE_OPTIONS;
  readonly contextModeOptions = CONTEXT_MODE_OPTIONS;
  readonly pictureSuggestions = PICTURE_SUGGESTIONS;

  readonly form = this.fb.group({
    suffix: [
      '',
      [Validators.required, Validators.pattern(FIELD_SUFFIX_PATTERN), Validators.maxLength(6)],
    ],
    type: ['C', [Validators.required]],
    size: [10, [Validators.required, Validators.min(1), Validators.max(254)]],
    decimals: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
    titlePt: ['', [Validators.required, Validators.maxLength(12)]],
    titleEs: ['', [Validators.maxLength(12)]],
    titleEn: ['', [Validators.maxLength(12)]],
    descPt: ['', [Validators.required, Validators.maxLength(25)]],
    descEs: ['', [Validators.maxLength(25)]],
    descEn: ['', [Validators.maxLength(25)]],
    picturePreset: [''],
    picture: ['', [Validators.maxLength(45)]],
    validation: ['', [Validators.maxLength(160)]],
    defaultRel: ['', [Validators.maxLength(160)]],
    whenExpr: ['', [Validators.maxLength(100)]],
    showBrowse: ['S'],
    visualMode: ['A'],
    contextMode: ['R'],
    combobox: this.fb.group({
      comboPt: [''],
      comboEs: [''],
      comboEn: [''],
    }),
    usadoEncoded: [''],
    modulesBitmap: [0],
    searchKey: ['', [Validators.maxLength(6)]],
    sqlCondition: ['', [Validators.maxLength(250)]],
    sqlCheck: ['', [Validators.maxLength(250)]],
    pyme: ['N'],
    spelling: ['N'],
    fieldIndex: ['N'],
    serverIndex: ['N'],
    modal: ['N'],
    positionLogix: ['N'],
  });

  constructor() {
    this.syncDecimalsState();
    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncDecimalsState());
  }

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: 'Tabela', link: `/projects/${this.projectId()}/tables/${this.tableId()}` },
        { label: this.isEditMode() ? 'Editar campo' : 'Novo campo' },
      ],
    };
  }

  get pageActions(): PoPageAction[] {
    return [
      {
        label: 'Voltar',
        icon: 'an an-arrow-left',
        action: () => this.cancel(),
      },
    ];
  }

  get fieldNamePreview(): string {
    const suffix = (this.form.controls.suffix.value ?? '').trim();
    if (!suffix) return `${this.tablePrefix()}_`;
    return `${this.tablePrefix()}_${suffix}`;
  }

  get isNumericType(): boolean {
    return this.form.controls.type.value === 'N';
  }

  get suffixError(): string {
    const c = this.form.controls.suffix;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Sufixo é obrigatório';
    if (c.hasError('pattern')) return 'Use apenas A-Z, 0-9 e _ (máx. 6)';
    return '';
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const tableId = this.route.snapshot.paramMap.get('tableId');
    const fieldId = this.route.snapshot.paramMap.get('fieldId');

    if (!projectId || !tableId) {
      void this.router.navigate(['/projects']);
      return;
    }

    this.projectId.set(projectId);
    this.tableId.set(tableId);
    if (fieldId) this.fieldId.set(fieldId);

    void this.loadContext(projectId, tableId, fieldId);
  }

  onSuffixInput(): void {
    const ctrl = this.form.controls.suffix;
    const upper = (ctrl.value ?? '').toUpperCase();
    if (upper !== ctrl.value) ctrl.setValue(upper, { emitEvent: false });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.save();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 's') {
      event.preventDefault();
      void this.save();
      return;
    }
    if (key === 'escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  applyPictureSuggestion(value: string): void {
    if (!value) return;
    this.form.controls.picture.setValue(value);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const raw = this.form.getRawValue();
      const name = `${this.tablePrefix()}_${raw.suffix}`;
      const basePayload = {
        name,
        type: raw.type as CreateFieldInput['type'],
        size: raw.size!,
        decimals: raw.decimals!,
        titlePt: raw.titlePt!,
        titleEs: raw.titleEs?.trim() || null,
        titleEn: raw.titleEn?.trim() || null,
        descPt: raw.descPt!,
        descEs: raw.descEs?.trim() || null,
        descEn: raw.descEn?.trim() || null,
        picture: raw.picture?.trim() || null,
        validation: raw.validation?.trim() || null,
        defaultRel: raw.defaultRel?.trim() || null,
        whenExpr: raw.whenExpr?.trim() || null,
        showBrowse: raw.showBrowse as 'S' | 'N',
        visualMode: raw.visualMode as 'V' | 'A' | 'R',
        contextMode: raw.contextMode as 'R' | 'V',
        comboPt: raw.combobox?.comboPt?.trim() || null,
        comboEs: raw.combobox?.comboEs?.trim() || null,
        comboEn: raw.combobox?.comboEn?.trim() || null,
        usadoFlags: { encoded: raw.usadoEncoded ?? '' },
        modulesFlags: { bitmap: raw.modulesBitmap ?? 0 },
        searchKey: raw.searchKey?.trim() || null,
        sqlCondition: raw.sqlCondition?.trim() || null,
        sqlCheck: raw.sqlCheck?.trim() || null,
        pyme: raw.pyme as 'S' | 'N',
        spelling: raw.spelling as 'S' | 'N',
        fieldIndex: raw.fieldIndex as 'S' | 'N',
        serverIndex: raw.serverIndex as 'S' | 'N',
        modal: raw.modal as 'S' | 'N',
        positionLogix: raw.positionLogix as 'S' | 'N',
      };

      if (this.isEditMode() && this.fieldId()) {
        const payload: UpdateFieldInput = basePayload;
        await this.fieldsStore.update(this.projectId(), this.tableId(), this.fieldId()!, payload);
        this.notification.success('Campo atualizado.');
      } else {
        const payload: CreateFieldInput = basePayload;
        await this.fieldsStore.create(this.projectId(), this.tableId(), payload);
        this.notification.success('Campo criado.');
      }

      void this.router.navigate(['/projects', this.projectId(), 'tables', this.tableId()]);
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/projects', this.projectId(), 'tables', this.tableId()]);
  }

  private async loadContext(
    projectId: string,
    tableId: string,
    fieldId: string | null,
  ): Promise<void> {
    this.isLoading.set(true);
    try {
      const table = await this.tablesService.get(projectId, tableId);
      this.tablePrefix.set(table.prefix);

      if (fieldId) {
        await this.fieldsStore.loadField(projectId, tableId, fieldId);
        const field = this.fieldsStore.currentField();
        if (!field) throw new Error('Field not found');
        const prefixWithUnderscore = `${table.prefix}_`;
        const suffix = field.name.startsWith(prefixWithUnderscore)
          ? field.name.slice(prefixWithUnderscore.length)
          : field.name;
        this.form.patchValue({
          suffix,
          type: field.type,
          size: field.size,
          decimals: field.decimals,
          titlePt: field.titlePt,
          titleEs: field.titleEs ?? '',
          titleEn: field.titleEn ?? '',
          descPt: field.descPt,
          descEs: field.descEs ?? '',
          descEn: field.descEn ?? '',
          picture: field.picture ?? '',
          validation: field.validation ?? '',
          defaultRel: field.defaultRel ?? '',
          whenExpr: field.whenExpr ?? '',
          showBrowse: field.showBrowse,
          visualMode: field.visualMode,
          contextMode: field.contextMode,
          combobox: {
            comboPt: field.comboPt ?? '',
            comboEs: field.comboEs ?? '',
            comboEn: field.comboEn ?? '',
          },
          usadoEncoded:
            (field.usadoFlags &&
              typeof field.usadoFlags === 'object' &&
              'encoded' in field.usadoFlags &&
              typeof field.usadoFlags['encoded'] === 'string' &&
              field.usadoFlags['encoded']) ||
            '',
          modulesBitmap:
            (field.modulesFlags &&
              typeof field.modulesFlags === 'object' &&
              'bitmap' in field.modulesFlags &&
              typeof field.modulesFlags['bitmap'] === 'number' &&
              field.modulesFlags['bitmap']) ||
            0,
          searchKey: field.searchKey ?? '',
          sqlCondition: field.sqlCondition ?? '',
          sqlCheck: field.sqlCheck ?? '',
          pyme: field.pyme,
          spelling: field.spelling,
          fieldIndex: field.fieldIndex,
          serverIndex: field.serverIndex,
          modal: field.modal,
          positionLogix: field.positionLogix,
        });
      }
    } catch {
      this.notification.error('Não foi possível carregar os dados do campo.');
      void this.router.navigate(['/projects', projectId, 'tables', tableId]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private syncDecimalsState(): void {
    const decimals = this.form.controls.decimals;
    if (this.form.controls.type.value !== 'N') {
      if (decimals.value !== 0) decimals.setValue(0, { emitEvent: false });
      decimals.disable({ emitEvent: false });
      return;
    }

    decimals.enable({ emitEvent: false });
  }
}
