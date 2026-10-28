import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Cloudflare Pages reads public/_headers verbatim, so the file is the policy.
const headers = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');

const block = (path: string) => {
  const lines = headers.split('\n');
  const start = lines.findIndex((l) => l.trim() === path);
  if (start === -1) return '';
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith(' ')) break;
    body.push(line.trim());
  }
  return body.join('\n');
};

describe('security headers', () => {
  it('stops other sites from framing the editor and the landing', () => {
    expect(block('/*')).toMatch(/^X-Frame-Options: DENY$/m);
  });

  it('lets the embed be framed, which is its whole job', () => {
    expect(block('/embed')).toMatch(/^! X-Frame-Options$/m);
    expect(block('/embed.html')).toMatch(/^! X-Frame-Options$/m);
  });

  it('sends HSTS and a content security policy that still allows Mapbox', () => {
    const all = block('/*');
    expect(all).toMatch(/^Strict-Transport-Security: max-age=\d+/m);
    const csp = all.match(/^Content-Security-Policy: (.+)$/m)?.[1] ?? '';
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.mapbox\.com/);
    expect(csp).toMatch(/worker-src[^;]*blob:/);
  });
});
