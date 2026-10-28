import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');

describe('supply chain', () => {
  it('runs CI with a read-only token', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/^permissions:\n\s+contents: read$/m);
  });

  it('ships the last patched release of Next 14', () => {
    const lock = JSON.parse(read('package-lock.json'));
    const [major, minor, patch] = lock.packages['node_modules/next'].version.split('.').map(Number);
    expect(major > 14 || (major === 14 && (minor > 2 || (minor === 2 && patch >= 35)))).toBe(true);
  });
});
