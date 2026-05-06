/**
 * Encoder para o campo X3_USADO do dicionário SX3.
 *
 * Desde o Protheus 12.1.7, X3_USADO é armazenado como 120 caracteres
 * seguros para texto. O formato legado tinha 15 bytes binários: 15 * 8 = 120
 * bits. O decoder aceita os dois formatos para importações de dicionários
 * existentes; o encoder sempre emite o formato atual.
 */

export interface UsadoFlags {
  visible: boolean;
  browse: boolean;
  query: boolean;
  canChange: boolean;
  required: boolean;
  virtual: boolean;
  noPrint: boolean;
  blocked: boolean;
  noGet: boolean;
  restricted: boolean;
  memo: boolean;
  noTrigger: boolean;
}

export const X3_USADO_LENGTH = 120;
export const X3_USADO_LEGACY_LENGTH = 15;

export const X3_USADO_FLAG_BITS: Record<keyof UsadoFlags, number> = {
  visible: 0,
  browse: 1,
  query: 2,
  canChange: 3,
  required: 4,
  virtual: 5,
  noPrint: 6,
  blocked: 7,
  noGet: 8,
  restricted: 9,
  memo: 10,
  noTrigger: 11,
};

const X3_USADO_ON = '1';
const X3_USADO_OFF = '0';
const X3_USADO_ALLOWED_CHARS = /^[01]{120}$/;
const CP1252_EXTENDED_BYTES = new Map<string, number>([
  ['€', 0x80],
  ['‚', 0x82],
  ['ƒ', 0x83],
  ['„', 0x84],
  ['…', 0x85],
  ['†', 0x86],
  ['‡', 0x87],
  ['ˆ', 0x88],
  ['‰', 0x89],
  ['Š', 0x8a],
  ['‹', 0x8b],
  ['Œ', 0x8c],
  ['Ž', 0x8e],
  ['‘', 0x91],
  ['’', 0x92],
  ['“', 0x93],
  ['”', 0x94],
  ['•', 0x95],
  ['–', 0x96],
  ['—', 0x97],
  ['˜', 0x98],
  ['™', 0x99],
  ['š', 0x9a],
  ['›', 0x9b],
  ['œ', 0x9c],
  ['ž', 0x9e],
  ['Ÿ', 0x9f],
]);

const X3_USADO_FLAG_KEYS = Object.keys(X3_USADO_FLAG_BITS) as Array<keyof UsadoFlags>;

/**
 * Codifica flags de X3_USADO no formato bitmap Protheus (120 chars).
 *
 * @param flags - Flags de uso do campo por módulo/situação
 * @returns String de 120 caracteres no formato textual atual
 */
export function encodeX3Usado(flags: UsadoFlags): string {
  assertUsadoFlags(flags);

  const bits = Array<string>(X3_USADO_LENGTH).fill(X3_USADO_OFF);

  for (const flag of X3_USADO_FLAG_KEYS) {
    if (flags[flag]) {
      bits[X3_USADO_FLAG_BITS[flag]] = X3_USADO_ON;
    }
  }

  return bits.join('');
}

/**
 * Decodifica o bitmap X3_USADO de volta para flags legíveis.
 *
 * @param encoded - String de 120 chars atual ou 15 bytes legados
 * @returns Flags decodificadas
 */
export function decodeX3Usado(encoded: string): UsadoFlags {
  if (typeof encoded !== 'string') {
    throw new TypeError('X3_USADO deve ser uma string.');
  }

  const bits = decodeX3UsadoBits(encoded);

  return X3_USADO_FLAG_KEYS.reduce(
    (flags, flag) => ({
      ...flags,
      [flag]: bits[X3_USADO_FLAG_BITS[flag]],
    }),
    createEmptyUsadoFlags(),
  );
}

function createEmptyUsadoFlags(): UsadoFlags {
  return {
    visible: false,
    browse: false,
    query: false,
    canChange: false,
    required: false,
    virtual: false,
    noPrint: false,
    blocked: false,
    noGet: false,
    restricted: false,
    memo: false,
    noTrigger: false,
  };
}

function decodeX3UsadoBits(encoded: string): boolean[] {
  if (encoded.length === X3_USADO_LENGTH) {
    if (!X3_USADO_ALLOWED_CHARS.test(encoded)) {
      throw new Error('X3_USADO textual deve conter apenas caracteres 0 ou 1.');
    }

    return [...encoded].map((bit) => bit === X3_USADO_ON);
  }

  if (encoded.length === X3_USADO_LEGACY_LENGTH) {
    return decodeLegacyX3UsadoBits(encoded);
  }

  throw new Error(
    `X3_USADO deve ter ${X3_USADO_LENGTH} caracteres ou ${X3_USADO_LEGACY_LENGTH} bytes legados.`,
  );
}

function decodeLegacyX3UsadoBits(encoded: string): boolean[] {
  const bits: boolean[] = [];

  for (const char of encoded) {
    const byte = legacyCharToByte(char);

    if (byte === undefined || byte > 0xff) {
      throw new Error('X3_USADO legado deve conter apenas bytes de 0 a 255.');
    }

    for (let bit = 7; bit >= 0; bit -= 1) {
      bits.push((byte & (1 << bit)) !== 0);
    }
  }

  return bits;
}

function legacyCharToByte(char: string): number | undefined {
  return CP1252_EXTENDED_BYTES.get(char) ?? char.codePointAt(0);
}

function assertUsadoFlags(flags: UsadoFlags): void {
  if (flags === null || typeof flags !== 'object') {
    throw new TypeError('Flags de X3_USADO devem ser um objeto.');
  }

  for (const flag of X3_USADO_FLAG_KEYS) {
    if (typeof flags[flag] !== 'boolean') {
      throw new TypeError(`Flag X3_USADO "${flag}" deve ser booleana.`);
    }
  }
}
