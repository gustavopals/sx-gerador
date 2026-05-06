import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import type { CreateIndexInput, UpdateIndexInput } from '@sxgerador/shared-types';
import { FieldsService } from '../../../../core/services/fields.service';
import { mapIndexesError } from '../../../../core/services/indexes.service';
import { TablesService } from '../../../../core/services/tables.service';
import { KeyBuilderComponent } from '../../../../shared/components/key-builder/key-builder.component';
import { IndexesStore } from '../../../../stores/indexes.store';

const YES_NO_OPTIONS: PoSelectOption[] = [
  { label: 'Sim', value: 'S' },
  { label: 'Não', value: 'N' },
];

const OWNER_OPTIONS: PoSelectOption[] = [
  { label: 'Usuário (U)', value: 'U' },
  { label: 'Sistema (S)', value: 'S' },
];

@Component({
  selector: 'sxg-index-form',
  imports: [ReactiveFormsModule, PoButtonModule, PoFieldModule, PoPageModule, KeyBuilderComponent],
  templateUrl: './index-form.component.html',
  styleUrl: './index-form.component.scss',
})
export class IndexFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tablesService = inject(TablesService);
  private readonly fieldsService = inject(FieldsService);
  private readonly indexesStore = inject(IndexesStore);
  private readonly notification = inject(PoNotificationService);

  readonly projectId = signal('');
  readonly tableId = signal('');
  readonly indexId = signal<string | null>(null);
  readonly tablePrefix = signal('');
  readonly availableFields = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isEditMode = computed(() => this.indexId() !== null);
  readonly submitType = PoButtonType.Submit;
  readonly yesNoOptions = YES_NO_OPTIONS;
  readonly ownerOptions = OWNER_OPTIONS;

  readonly form = this.fb.group({
    order: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    key: ['', [Validators.required, Validators.maxLength(160)]],
    descPt: ['', [Validators.required, Validators.maxLength(70)]],
    descEs: ['', [Validators.maxLength(70)]],
    descEn: ['', [Validators.maxLength(70)]],
    owner: ['U', [Validators.required]],
    searchExpr: ['', [Validators.maxLength(160)]],
    nickname: ['', [Validators.maxLength(10)]],
    showSearch: ['S'],
    isVirtual: ['N'],
    virtualCustomizable: ['N'],
    notes: ['', [Validators.maxLength(2000)]],
  });

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: 'Tabela', link: `/projects/${this.projectId()}/tables/${this.tableId()}` },
        { label: this.isEditMode() ? 'Editar índice' : 'Novo índice' },
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

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const tableId = this.route.snapshot.paramMap.get('tableId');
    const indexId = this.route.snapshot.paramMap.get('indexId');

    if (!projectId || !tableId) {
      void this.router.navigate(['/projects']);
      return;
    }

    this.projectId.set(projectId);
    this.tableId.set(tableId);
    if (indexId) this.indexId.set(indexId);

    void this.loadContext(projectId, tableId, indexId);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const raw = this.form.getRawValue();
      const payload = {
        order: raw.order!,
        key: raw.key!,
        descPt: raw.descPt!,
        descEs: raw.descEs?.trim() || null,
        descEn: raw.descEn?.trim() || null,
        owner: raw.owner as 'U' | 'S',
        searchExpr: raw.searchExpr?.trim() || null,
        nickname: raw.nickname?.trim() || null,
        showSearch: raw.showSearch as 'S' | 'N',
        isVirtual: raw.isVirtual as 'S' | 'N',
        virtualCustomizable: raw.virtualCustomizable as 'S' | 'N',
        notes: raw.notes?.trim() || null,
      };

      if (this.isEditMode() && this.indexId()) {
        await this.indexesStore.update(
          this.projectId(),
          this.tableId(),
          this.indexId()!,
          payload as UpdateIndexInput,
        );
        this.notification.success('Índice atualizado.');
      } else {
        await this.indexesStore.create(
          this.projectId(),
          this.tableId(),
          payload as CreateIndexInput,
        );
        this.notification.success('Índice criado.');
      }

      void this.router.navigate(['/projects', this.projectId(), 'tables', this.tableId()]);
    } catch (err) {
      this.notification.error(mapIndexesError(err));
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
    indexId: string | null,
  ): Promise<void> {
    this.isLoading.set(true);
    try {
      const [table, fieldsResponse] = await Promise.all([
        this.tablesService.get(projectId, tableId),
        this.fieldsService.list(projectId, tableId),
      ]);
      this.tablePrefix.set(table.prefix);
      this.availableFields.set(
        fieldsResponse.fields.filter((field) => !field.deletedAt).map((field) => field.name),
      );

      if (indexId) {
        await this.indexesStore.loadIndex(projectId, tableId, indexId);
        const index = this.indexesStore.currentIndex();
        if (!index) throw new Error('Index not found');
        this.form.patchValue({
          order: index.order,
          key: index.key,
          descPt: index.descPt,
          descEs: index.descEs ?? '',
          descEn: index.descEn ?? '',
          owner: index.owner,
          searchExpr: index.searchExpr ?? '',
          nickname: index.nickname ?? '',
          showSearch: index.showSearch,
          isVirtual: index.isVirtual,
          virtualCustomizable: index.virtualCustomizable,
          notes: index.notes ?? '',
        });
      }
    } catch (err) {
      this.notification.error(mapIndexesError(err));
      void this.router.navigate(['/projects', projectId, 'tables', tableId]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
