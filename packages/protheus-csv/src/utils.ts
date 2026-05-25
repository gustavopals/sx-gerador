import type { SharingMode, YesNo } from './types';

export function generateCuid(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  return `c${time}${rand}`.slice(0, 25).padEnd(25, '0');
}

export function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== '') return v.trim();
  }
  return '';
}

export function pickInt(row: Record<string, string>, fallback: number, ...keys: string[]): number {
  const raw = pick(row, ...keys);
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function pickYesNo(row: Record<string, string>, fallback: YesNo, ...keys: string[]): YesNo {
  const raw = pick(row, ...keys).toUpperCase();
  if (raw === 'S' || raw === 'N') return raw;
  return fallback;
}

export function pickSharing(
  row: Record<string, string>,
  fallback: SharingMode,
  ...keys: string[]
): SharingMode {
  const raw = pick(row, ...keys).toUpperCase();
  if (raw === 'C' || raw === 'E') return raw;
  return fallback;
}

export function emptyToNull(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}
