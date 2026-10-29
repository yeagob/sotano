import { describe, expect, it } from 'vitest';

describe('build version', () => {
  // vite.config.ts defines APP_VERSION as "v<package version> · <YYMMDDHHmm>"
  it('is injected as package version plus a build stamp', () => {
    // a development build carries a pre-release suffix, e.g. v0.2.0-dev · 2610291200
    expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+(-[\w.]+)? · \d{10}$/);
  });
});
