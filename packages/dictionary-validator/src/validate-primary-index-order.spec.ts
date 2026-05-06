import { describe, expect, it } from 'vitest';
import { validatePrimaryIndexOrder } from './validate-primary-index-order.js';

describe('validatePrimaryIndexOrder', () => {
  it('accepts non-primary orders regardless of existing primary index', () => {
    const result = validatePrimaryIndexOrder({
      existingOrders: ['1', '2'],
      order: '3',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts primary order when table has no primary index yet', () => {
    const result = validatePrimaryIndexOrder({
      existingOrders: ['2', '3'],
      order: '1',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects creating a second primary index', () => {
    const result = validatePrimaryIndexOrder({
      existingOrders: ['1', '2', '3'],
      order: '1',
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/índice de ordem 1/i);
  });

  it('accepts updating existing primary index without changing order', () => {
    const result = validatePrimaryIndexOrder({
      existingOrders: ['1', '2'],
      order: '1',
      currentOrder: '1',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty order', () => {
    const result = validatePrimaryIndexOrder({
      existingOrders: ['2'],
      order: '   ',
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/obrigatória/i);
  });
});
