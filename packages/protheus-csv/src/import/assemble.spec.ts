import { describe, expect, it } from 'vitest';
import { assembleCsvImport } from './assemble';

const SX2_CSV = `X2_CHAVE;X2_ARQUIVO;X2_NOME;X2_NOMESPA;X2_NOMEENG;X2_ROTINA;X2_MODO;X2_MODOUN;X2_MODOEMP;X2_TTS;X2_UNICO;X2_PYME;X2_MODULO;X2_CLOB;X2_AUTREC;X2_TAMFIL;X2_TAMUN;X2_TAMEMP
ZZZ;ZZZ010;Cadastro Teste;;;;C;C;C;S;ZZZ_FILIAL+ZZZ_COD;N;0;N;N;2;2;2
`;

const SX3_CSV = `X3_ARQUIVO;X3_ORDEM;X3_CAMPO;X3_TIPO;X3_TAMANHO;X3_DECIMAL;X3_TITULO;X3_DESCRIC;X3_USADO;X3_MODULO
ZZZ;01;ZZZ_FILIAL;C;2;0;Filial;Filial;${'1'.repeat(120)};0
ZZZ;02;ZZZ_COD;C;10;0;Codigo;Codigo;${'0'.repeat(120)};0
`;

const SIX_CSV = `INDICE;ORDEM;CHAVE;DESCRICAO;PROPRI;SHOWPESQ;IX_VIRTUAL;IX_VIRCUST
ZZZ;1;ZZZ_FILIAL+ZZZ_COD;Chave primaria;U;S;N;N
`;

describe('assembleCsvImport', () => {
  it('merges SX2, SX3 and SIX', () => {
    const result = assembleCsvImport({ sx2: SX2_CSV, sx3: SX3_CSV, six: SIX_CSV });
    expect(result.errors).toEqual([]);
    expect(result.tables).toHaveLength(1);
    const table = result.tables[0];
    expect(table.prefix).toBe('ZZZ');
    expect(table.namePt).toBe('Cadastro Teste');
    expect(table.fields).toHaveLength(2);
    expect(table.indexes).toHaveLength(1);
    expect(table.indexes[0].order).toBe('1');
  });

  it('decodes X3_USADO into usadoFlags', () => {
    const result = assembleCsvImport({ sx3: SX3_CSV });
    expect(result.errors).toEqual([]);
    const filial = result.tables[0].fields.find((f) => f.name === 'ZZZ_FILIAL');
    expect(filial?.usadoFlags['visible']).toBe(true);
  });

  it('requires at least one file', () => {
    const result = assembleCsvImport({});
    expect(result.tables).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
