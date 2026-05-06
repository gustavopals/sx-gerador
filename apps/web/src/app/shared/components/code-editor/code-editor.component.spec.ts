import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { highlightCode, validateCodeSyntax } from './code-editor.component';

describe('sxg-code-editor helpers', () => {
  it('highlights advpl keywords', () => {
    const html = highlightCode('User Function Test()\nReturn Nil', 'advpl');
    expect(html).toContain('sxg-code-editor__kw');
  });

  it('highlights sql keywords', () => {
    const html = highlightCode('select * from users', 'sql');
    expect(html).toContain('sxg-code-editor__kw');
  });

  it('returns syntax error for unbalanced parentheses', () => {
    expect(validateCodeSyntax('SELECT (1', 'sql')).toMatch(/Parênteses desbalanceados/);
  });

  it('returns syntax error for invalid SQL verb', () => {
    expect(validateCodeSyntax('WITH cte AS (SELECT 1) SELECT * FROM cte', 'sql')).toMatch(
      /comando válido/,
    );
  });

  it('accepts valid SQL', () => {
    expect(validateCodeSyntax('SELECT * FROM SA1 WHERE SA1_COD = "1"', 'sql')).toBeNull();
  });
});
