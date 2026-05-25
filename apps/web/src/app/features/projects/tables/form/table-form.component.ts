import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  type PoBreadcrumb,
  type PoPageAction,
  type PoSelectOption,
} from '@po-ui/ng-components';
import { validatePrefix } from '@sxgerador/dictionary-validator';
import { mapTablesError, TablesService } from '../../../../core/services/tables.service';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ModulesEditorComponent } from '../../../../shared/components/modules-editor/modules-editor.component';

const PREFIX_PATTERN = /^[A-Z0-9]{3}$/;

const SHARING_MODE_OPTIONS: PoSelectOption[] = [
  { label: 'Compartilhado', value: 'C' },
  { label: 'Exclusivo', value: 'E' },
];

const YES_NO_OPTIONS: PoSelectOption[] = [
  { label: 'Sim', value: 'S' },
  { label: 'Não', value: 'N' },
];

const TAM_OPTIONS: PoSelectOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
  label: String(n),
  value: n,
}));

@Component({
  selector: 'sxg-table-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PoButtonModule,
    PoFieldModule,
    PoPageModule,
    ModulesEditorComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './table-form.component.html',
  styleUrl: './table-form.component.scss',
})
export class TableFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tablesService = inject(TablesService);
  private readonly notification = inject(PoNotificationService);
  private readonly fb = inject(FormBuilder);

  readonly projectId = signal<string>('');
  readonly tableId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.tableId() !== null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly submitType = PoButtonType.Submit;

  readonly sharingModeOptions = SHARING_MODE_OPTIONS;
  readonly yesNoOptions = YES_NO_OPTIONS;
  readonly tamOptions = TAM_OPTIONS;

  readonly form = this.fb.group({
    prefix: ['', [Validators.required, Validators.pattern(PREFIX_PATTERN)]],
    namePt: ['', [Validators.required, Validators.maxLength(30)]],
    nameEs: ['', [Validators.maxLength(30)]],
    nameEn: ['', [Validators.maxLength(30)]],
    routine: ['', [Validators.maxLength(40)]],
    modeCompany: ['C'],
    modeUnit: ['C'],
    modeBranch: ['C'],
    ttsEnabled: ['S'],
    pyme: ['N'],
    modules: [0],
    uniqueKey: ['', [Validators.maxLength(250)]],
    hasClob: ['N'],
    autoIncRec: ['N'],
    tamFil: [2],
    tamUn: [2],
    tamEmp: [2],
    notes: ['', [Validators.maxLength(2000)]],
  });

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: this.isEditMode() ? 'Editar tabela' : 'Nova tabela' },
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

  get pageTitle(): string {
    return this.isEditMode() ? 'Editar tabela' : 'Nova tabela';
  }

  get pageSubtitle(): string {
    return this.isEditMode()
      ? 'Atualize as definições SX2 da tabela'
      : 'Defina as propriedades SX2 da nova tabela';
  }

  get fileNamePreview(): string {
    const prefix = this.form.controls.prefix.value ?? '';
    if (PREFIX_PATTERN.test(prefix)) return `${prefix}010`;
    return '';
  }

  get prefixWarning(): string {
    const prefix = this.form.controls.prefix.value ?? '';
    if (!PREFIX_PATTERN.test(prefix)) return '';
    const result = validatePrefix(prefix);
    return result.warnings[0] ?? '';
  }

  get prefixError(): string {
    const c = this.form.controls.prefix;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Prefixo é obrigatório';
    if (c.hasError('pattern')) return 'Deve ter 3 caracteres: letras A-Z e dígitos em maiúsculas';
    return '';
  }

  get namePtError(): string {
    const c = this.form.controls.namePt;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Nome é obrigatório';
    if (c.hasError('maxlength')) return 'Máximo 30 caracteres';
    return '';
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const tableId = this.route.snapshot.paramMap.get('tableId');

    if (!projectId) {
      void this.router.navigate(['/projects']);
      return;
    }

    this.projectId.set(projectId);

    if (tableId) {
      this.tableId.set(tableId);
      void this.loadTable(projectId, tableId);
    }
  }

  onPrefixInput(): void {
    const ctrl = this.form.controls.prefix;
    const upper = (ctrl.value ?? '').toUpperCase();
    if (ctrl.value !== upper) {
      ctrl.setValue(upper, { emitEvent: false });
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const raw = this.form.getRawValue();
      const projectId = this.projectId();
      const tableId = this.tableId();

      if (tableId) {
        await this.tablesService.update(projectId, tableId, {
          namePt: raw.namePt!,
          nameEs: raw.nameEs?.trim() || null,
          nameEn: raw.nameEn?.trim() || null,
          routine: raw.routine?.trim() || null,
          modeCompany: raw.modeCompany as 'C' | 'E',
          modeUnit: raw.modeUnit as 'C' | 'E',
          modeBranch: raw.modeBranch as 'C' | 'E',
          ttsEnabled: raw.ttsEnabled as 'S' | 'N',
          pyme: raw.pyme as 'S' | 'N',
          modules: raw.modules!,
          uniqueKey: raw.uniqueKey?.trim() || null,
          hasClob: raw.hasClob as 'S' | 'N',
          autoIncRec: raw.autoIncRec as 'S' | 'N',
          tamFil: raw.tamFil!,
          tamUn: raw.tamUn!,
          tamEmp: raw.tamEmp!,
          notes: raw.notes?.trim() || null,
        });
        this.notification.success('Tabela atualizada.');
      } else {
        await this.tablesService.create(projectId, {
          prefix: raw.prefix!,
          namePt: raw.namePt!,
          nameEs: raw.nameEs?.trim() || null,
          nameEn: raw.nameEn?.trim() || null,
          routine: raw.routine?.trim() || null,
          modeCompany: raw.modeCompany as 'C' | 'E',
          modeUnit: raw.modeUnit as 'C' | 'E',
          modeBranch: raw.modeBranch as 'C' | 'E',
          ttsEnabled: raw.ttsEnabled as 'S' | 'N',
          pyme: raw.pyme as 'S' | 'N',
          modules: raw.modules!,
          uniqueKey: raw.uniqueKey?.trim() || null,
          hasClob: raw.hasClob as 'S' | 'N',
          autoIncRec: raw.autoIncRec as 'S' | 'N',
          tamFil: raw.tamFil!,
          tamUn: raw.tamUn!,
          tamEmp: raw.tamEmp!,
          notes: raw.notes?.trim() || null,
        });
        this.notification.success('Tabela criada.');
      }

      void this.router.navigate(['/projects', projectId]);
    } catch (err) {
      this.notification.error(mapTablesError(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/projects', this.projectId()]);
  }

  private async loadTable(projectId: string, tableId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const table = await this.tablesService.get(projectId, tableId);
      this.form.patchValue({
        prefix: table.prefix,
        namePt: table.namePt,
        nameEs: table.nameEs ?? '',
        nameEn: table.nameEn ?? '',
        routine: table.routine ?? '',
        modeCompany: table.modeCompany,
        modeUnit: table.modeUnit,
        modeBranch: table.modeBranch,
        ttsEnabled: table.ttsEnabled,
        pyme: table.pyme,
        modules: table.modules,
        uniqueKey: table.uniqueKey ?? '',
        hasClob: table.hasClob,
        autoIncRec: table.autoIncRec,
        tamFil: table.tamFil,
        tamUn: table.tamUn,
        tamEmp: table.tamEmp,
        notes: table.notes ?? '',
      });
      this.form.controls.prefix.disable();
    } catch {
      this.notification.error('Não foi possível carregar a tabela.');
      void this.router.navigate(['/projects', projectId]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
